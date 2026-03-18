# FinMark AI 后端开发计划 - LLM 网关与智能体编排

## 概述

本文档描述 FinMark AI 后端核心模块的设计：LLM 网关和智能体编排层。

## 技术栈

- **运行时**: Node.js + Express + TypeScript
- **AI 框架**: LangChain + LangGraph
- **LLM 网关**: LiteLLM (支持 100+ 模型)
- **数据库**: SQLite (开发) / MySQL (生产)
- **ORM**: Prisma
- **认证**: JWT

## 架构设计

```
┌─────────────────────────────────────────────────┐
│                   API Gateway                    │
├─────────────────────────────────────────────────┤
│  /api/agents  /api/scenarios  /api/atoms ...   │
├─────────────────────────────────────────────────┤
│              Agent Orchestration Layer          │
│  ┌─────────────────────────────────────────┐   │
│  │         LangGraph Workflow               │   │
│  │  MasterAgent → Insight → Segment → ...  │   │
│  │         ↳ Content → Compliance → Strategy│   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│                 LLM Gateway (LiteLLM)          │
│  ┌─────────────────────────────────────────┐   │
│  │  Gemini │ Claude │ OpenAI │ Qwen │ ...  │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│              Data Layer (Prisma)               │
└─────────────────────────────────────────────────┘
```

## 模块设计

### 1. LLM Gateway (LiteLLM)

#### 1.1 核心能力

| 能力 | 说明 |
|------|------|
| 统一接口 | 所有模型使用相同调用方式，屏蔽底层差异 |
| 负载均衡 | 多账号/多端点轮询，自动失败转移 |
| 成本控制 | 按模型/用户/部门统计 Token 消耗 |

#### 1.2 配置模型

```typescript
interface LLMProvider {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'qwen';
  apiKey: string;
  baseUrl?: string;
  models: string[];
  isActive: boolean;
  priority: number;
}

interface ModelConfig {
  providerId: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
}
```

### 2. Agent Orchestration (LangChain + LangGraph)

#### 2.1 智能体定义

| 智能体 | 职责 | 使用模型 |
|--------|------|----------|
| Master Agent | 任务分解、流程编排 | Gemini Pro |
| Insight Agent | 客户洞察、需求分析 | Gemini Pro |
| Segment Agent | 客群筛选、标签匹配 | Gemini Pro |
| Content Agent | 文案生成、多渠道适配 | Gemini Pro |
| Compliance Agent | 合规审查、风险预警 | Gemini Pro |
| Strategy Agent | 触达策略、预算分配 | Gemini Pro |
| Analyst Agent | 效果评估、ROI 分析 | Gemini Pro |

#### 2.2 LangGraph 工作流

```typescript
// Master Agent 编排流程
const marketingWorkflow = {
  nodes: [
    { id: 'master', type: 'master', next: ['insight', 'segment'] },
    { id: 'insight', type: 'insight', next: ['segment'] },
    { id: 'segment', type: 'segment', next: ['content'] },
    { id: 'content', type: 'content', next: ['compliance'] },
    { id: 'compliance', type: 'compliance', next: ['strategy'] },
    { id: 'strategy', type: 'strategy', next: ['analyst'] },
    { id: 'analyst', type: 'analyst', next: [] },
  ],
  edges: [
    // 并行执行分支
    { from: 'master', to: 'insight', type: 'parallel' },
    { from: 'master', to: 'segment', type: 'parallel' },
    // 串行执行
    { from: 'insight', to: 'segment', type: 'conditional' },
  ]
};
```

### 3. API 接口设计

#### 3.1 智能体 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/agents/master | 主智能体编排 |
| POST | /api/agents/:type | 单智能体调用 |
| POST | /api/agents/stream | 流式调用 |
| POST | /api/agents/copilot/chat | RM Copilot 对话 |

#### 3.2 流式响应

```typescript
// SSE 流式响应
app.post('/api/agents/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  for await (const chunk of agent.execute(prompt)) {
    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
  }
  res.end();
});
```

### 4. 数据模型 (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
}

model Scenario {
  id          String   @id @default(uuid())
  title       String
  goal        String
  category    String
  status      String   @default("draft")
  config      Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Atom {
  id          String   @id @default(uuid())
  name        String
  type        String
  category    String
  conditions  Json
  status      String   @default("active")
  createdAt   DateTime @default(now())
}

model LLMProvider {
  id        String   @id @default(uuid())
  provider  String
  apiKey    String
  baseUrl   String?
  models    String[]
  isActive  Boolean  @default(true)
  priority  Int      @default(0)
}
```

## 实现计划

### Phase 1: LLM Gateway
1. LiteLLM 集成
2. 多模型配置
3. 成本统计

### Phase 2: Agent Core
1. LangChain Agent 定义
2. LangGraph Workflow
3. 工具函数封装

### Phase 3: API Layer
1. RESTful API
2. SSE 流式响应
3. 认证授权

### Phase 4: Data Layer
1. Prisma Schema
2. 数据库迁移
3. CRUD 接口
