# FinMark AI 后端实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 FinMark AI 后端服务，实现 LLM 网关和智能体编排层

**Architecture:** 
- 使用 Express + TypeScript
- LiteLLM 作为 LLM 网关
- LangChain + LangGraph 实现智能体编排
- Prisma 作为 ORM 层

**Tech Stack:** Node.js, Express, TypeScript, LiteLLM, LangChain, LangGraph, Prisma, SQLite

---

## 目录结构

```
backend/
├── src/
│   ├── index.ts              # 入口文件
│   ├── config/
│   │   └── database.ts      # Prisma 配置
│   ├── middleware/
│   │   ├── auth.ts          # JWT 认证
│   │   └── error.ts         # 错误处理
│   ├── routes/
│   │   ├── index.ts         # 路由入口
│   │   ├── agent.ts         # 智能体路由
│   │   ├── scenario.ts      # 场景路由
│   │   ├── atom.ts          # 策略原子路由
│   │   └── auth.ts          # 认证路由
│   ├── services/
│   │   ├── llmGateway.ts    # LiteLLM 网关
│   │   ├── agentFactory.ts  # 智能体工厂
│   │   └── workflow.ts      # LangGraph 工作流
│   ├── agents/              # 智能体定义
│   │   ├── base.ts
│   │   ├── master.ts
│   │   ├── insight.ts
│   │   ├── segment.ts
│   │   ├── content.ts
│   │   ├── compliance.ts
│   │   ├── strategy.ts
│   │   └── analyst.ts
│   ├── tools/              # 工具函数
│   │   └── index.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

---

## Chunk 1: 项目初始化

### 1.1 创建后端目录和配置文件

- [ ] **Step 1: 创建 backend 目录**

```bash
mkdir -p backend/src/{config,middleware,routes,services,agents,tools,types}
mkdir -p backend/prisma
```

- [ ] **Step 2: 创建 package.json**

```bash
cat > backend/package.json << 'EOF'
{
  "name": "finmark-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@langchain/core": "^0.3.0",
    "@langchain/langgraph": "^0.2.0",
    "litellm": "^1.0.0",
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.0.0",
    "prisma": "^6.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0"
  }
}
EOF
```

- [ ] **Step 3: 创建 tsconfig.json**

```bash
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

- [ ] **Step 4: 创建 .env.example**

```bash
cat > backend/.env.example << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-secret-key"

# LLM Providers (add API keys as needed)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_API_KEY=""
AZURE_API_KEY=""
QWEN_API_KEY=""
EOF
```

- [ ] **Step 5: Commit**

```bash
cd backend
git add .
git commit -m "feat: initialize backend project structure"
```

---

## Chunk 2: 数据库层 (Prisma)

### 2.1 创建 Prisma Schema

- [ ] **Step 1: 创建 prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user")  // admin, manager, user
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Scenario {
  id           String   @id @default(uuid())
  title        String
  goal         String
  category     String   // acquisition, growth, mature, declining, recovery
  icon         String?
  color        String?
  config       String?  // JSON string
  status       String   @default("draft") // draft, active, paused
  complianceScore Int?
  riskLevel    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  executions   Execution[]
}

model Execution {
  id          String   @id @default(uuid())
  scenarioId  String
  scenario    Scenario @relation(fields: [scenarioId], references: [id])
  status      String   // pending, running, completed, failed
  config      String?  // JSON
  result      String?  // JSON
  targetCount Int?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
}

model Atom {
  id          String   @id @default(uuid())
  name        String
  type        String   // customer_segment, insight_rule, content_template, strategy_template
  category    String
  description String?
  conditions  String   // JSON string
  status      String   @default("active") // active, inactive
  version     String   @default("v1.0")
  metrics     String?  // JSON
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model LLMProvider {
  id        String   @id @default(uuid())
  name      String   // openai, anthropic, google, azure, qwen
  apiKey    String
  baseUrl   String?
  models    String   // JSON array
  isActive  Boolean  @default(true)
  priority  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  resource  String
  details   String?  // JSON
  ip        String?
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: 生成 Prisma Client**

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Prisma schema and database setup"
```

---

## Chunk 3: LLM Gateway (LiteLLM)

### 3.1 创建 LLM 网关服务

- [ ] **Step 1: 创建 src/services/llmGateway.ts**

```typescript
import { litellm } from 'litellm';

interface LLMRequest {
  model: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface LLMResponse {
  id: string;
  model: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMGateway {
  private defaultModel = 'gemini/gemini-1.5-pro';
  
  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await litellm.completion({
        model: request.model || this.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      });
      
      return {
        id: response.id,
        model: response.model,
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
      };
    } catch (error) {
      console.error('LLM Gateway Error:', error);
      throw error;
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<string> {
    const response = await litellm.completion({
      model: request.model || this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
    });

    for (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  }

  // 获取可用模型列表
  getAvailableModels(): string[] {
    return [
      'gemini/gemini-1.5-pro',
      'gemini/gemini-1.5-flash',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'anthropic/claude-3-5-sonnet-20241022',
      'qwen/qwen-plus',
    ];
  }
}

export const llmGateway = new LLMGateway();
export type { LLMRequest, LLMResponse };
```

- [ ] **Step 2: 创建 src/config/database.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add LLM gateway with LiteLLM"
```

---

## Chunk 4: 智能体定义 (LangChain)

### 4.1 创建基础智能体类

- [ ] **Step 1: 创建 src/agents/base.ts**

```typescript
import { llmGateway, type LLMRequest } from '../services/llmGateway.js';

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }

  protected buildMessages(userMessage: string): LLMRequest['messages'] {
    return [
      { role: 'system', content: this.config.systemPrompt },
      { role: 'user', content: userMessage },
    ];
  }

  async execute(input: string): Promise<string> {
    const messages = this.buildMessages(input);
    const response = await llmGateway.complete({
      model: this.config.model || 'gemini/gemini-1.5-pro',
      messages,
      temperature: this.config.temperature ?? 0.7,
    });
    return response.content;
  }

  async *stream(input: string): AsyncGenerator<string> {
    const messages = this.buildMessages(input);
    for await (const chunk of llmGateway.stream({ messages })) {
      yield chunk;
    }
  }

  getName(): string {
    return this.config.name;
  }

  getDescription(): string {
    return this.config.description;
  }
}
```

- [ ] **Step 2: 创建 src/agents/master.ts**

```typescript
import { BaseAgent, type AgentConfig } from './base.js';

const MASTER_PROMPT = `你是一个金融营销总监，负责协调多个AI智能体完成营销任务。

## 你的职责
1. 理解用户的营销目标
2. 将目标分解为可执行的子任务
3. 协调各智能体工作
4. 汇总结果并输出完整方案

## 输出格式
请直接输出Markdown格式的方案，不需要JSON。

## 关键能力
- 目标拆解
- 资源分配
- 风险评估
- 效果预测`;

export class MasterAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Master Agent',
      description: '营销任务编排器',
      systemPrompt: MASTER_PROMPT,
      model: 'gemini/gemini-1.5-pro',
      temperature: 0.5,
    });
  }

  async orchestrate(goal: string, context?: Record<string, any>): Promise<string> {
    const prompt = `营销目标: ${goal}
    
请分解这个目标并输出执行方案。`;

    return this.execute(prompt);
  }
}
```

- [ ] **Step 3: 创建其他智能体**

创建 `src/agents/insight.ts`, `src/agents/segment.ts`, `src/agents/content.ts`, `src/agents/compliance.ts`, `src/agents/strategy.ts`, `src/agents/analyst.ts`，每个参照 master.ts 的结构。

- [ ] **Step 4: 创建 src/agents/index.ts**

```typescript
export { BaseAgent } from './base.js';
export { MasterAgent } from './master.js';
export { InsightAgent } from './insight.js';
export { SegmentAgent } from './segment.js';
export { ContentAgent } from './content.js';
export { ComplianceAgent } from './compliance.js';
export { StrategyAgent } from './strategy.js';
export { AnalystAgent } from './analyst.js';
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add LangChain agents"
```

---

## Chunk 5: API 路由

### 5.1 创建 Express 服务器和路由

- [ ] **Step 1: 创建 src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { agentRouter } from './routes/agent.js';
import { scenarioRouter } from './routes/scenario.js';
import { atomRouter } from './routes/atom.js';
import { authRouter } from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/agents', agentRouter);
app.use('/api/scenarios', scenarioRouter);
app.use('/api/atoms', atomRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
```

- [ ] **Step 2: 创建 src/routes/agent.ts**

```typescript
import { Router } from 'express';
import { MasterAgent, InsightAgent, SegmentAgent, ContentAgent, ComplianceAgent, StrategyAgent, AnalystAgent } from '../agents/index.js';

const router = Router();

const agents = {
  master: new MasterAgent(),
  insight: new InsightAgent(),
  segment: new SegmentAgent(),
  content: new ContentAgent(),
  compliance: new ComplianceAgent(),
  strategy: new StrategyAgent(),
  analyst: new AnalystAgent(),
};

// POST /api/agents/:type - 调用单个智能体
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { prompt, context } = req.body;
    
    const agent = agents[type as keyof typeof agents];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const result = await agent.execute(prompt);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents/master - 主智能体编排
router.post('/master', async (req, res) => {
  try {
    const { goal, context } = req.body;
    const masterAgent = new MasterAgent();
    
    const result = await masterAgent.orchestrate(goal, context);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents/stream - 流式调用
router.post('/stream/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { prompt } = req.body;
    
    const agent = agents[type as keyof typeof agents];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of agent.stream(prompt)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as agentRouter };
```

- [ ] **Step 3: 创建其他路由**

创建 `src/routes/scenario.ts`, `src/routes/atom.ts`, `src/routes/auth.ts`

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add API routes"
```

---

## 验证步骤

- [ ] 运行 `cd backend && npm run dev`
- [ ] 测试 `curl http://localhost:3001/health`
- [ ] 测试智能体调用 `curl -X POST http://localhost:3001/api/agents/master -H "Content-Type: application/json" -d '{"goal":"推广新基金"}'`
