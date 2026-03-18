# FinMark AI 后端微服务实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 FinMark AI 微服务后端架构，包含 API Gateway、Agent Service、LLM Gateway、Data Service

**Architecture:** 微服务架构，HTTP/REST 通信，Kong Gateway，Docker Compose 部署

**Tech Stack:** Node.js, Express, TypeScript, LiteLLM, LangChain, LangGraph, Prisma, PostgreSQL, Docker, Kong

---

## 目录结构

```
finmark-backend/
├── docker-compose.yml
├── kong/
│   └── kong.yml
├── services/
│   ├── api-gateway/       # Kong 配置
│   ├── agent-service/      # 智能体编排服务
│   ├── llm-gateway/       # LLM 网关服务
│   ├── data-service/       # 数据服务
│   └── workflow-service/   # 工作流服务
└── docs/
```

---

## Phase 1: 基础设施 (Kong + Docker Compose)

### 1.1 创建 Docker Compose 配置

- [ ] **Step 1: 创建项目目录**

```bash
mkdir -p finmark-backend/{kong,services/{api-gateway,agent-service,llm-gateway,data-service,workflow-service},docs}
```

- [ ] **Step 2: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  kong:
    image: kong:3.4
    ports:
      - "8000:8000"
      - "8443:8443"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /usr/local/kong/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    volumes:
      - ./kong/kong.yml:/usr/local/kong/kong.yml:ro
    networks:
      - finmark-network

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: finmark
      POSTGRES_PASSWORD: finmark
      POSTGRES_DB: finmark
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - finmark-network

  redis:
    image: redis:7-alpine
    networks:
      - finmark-network

volumes:
  postgres-data:

networks:
  finmark-network:
    driver: bridge
```

- [ ] **Step 3: 创建 Kong 配置 kong/kong.yml**

```yaml
_format_version: "3.0"
_transform: true

services:
  - name: agent-service
    url: http://agent-service:3001
    routes:
      - name: agent-route
        paths:
          - /api/agents
    plugins:
      - name: rate-limiting
        config:
          minute: 100

  - name: llm-gateway
    url: http://llm-gateway:3002
    routes:
      - name: llm-route
        paths:
          - /api/llm

  - name: data-service
    url: http://data-service:3003
    routes:
      - name: data-route
        paths:
          - /api/data

consumers:
  - username: frontend
  - username: internal
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add Docker Compose and Kong configuration"
```

---

## Phase 2: LLM Gateway Service

### 2.1 创建 LLM Gateway 服务

- [ ] **Step 1: 创建 agent-service/package.json**

```json
{
  "name": "llm-gateway",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "litellm": "^1.0.0",
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 创建 src/services/llmGateway.ts**

```typescript
import { litellm } from 'litellm';

interface LLMRequest {
  model: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

class LLMGateway {
  private defaultModel = 'gemini/gemini-1.5-pro';
  
  async complete(request: LLMRequest): Promise<{ content: string; usage?: any }> {
    const response = await litellm.completion({
      model: request.model || this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    });
    
    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
    };
  }

  async *stream(request: LLMRequest): AsyncGenerator<string> {
    const response = await litellm.completion({
      model: request.model || this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  }
}

export const llmGateway = new LLMGateway();
```

- [ ] **Step 3: 创建 src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { llmGateway } from './services/llmGateway.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/v1/completions', async (req, res) => {
  try {
    const result = await llmGateway.complete(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  for await (const chunk of llmGateway.stream(req.body)) {
    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
  }
  res.end();
});

const PORT = 3002;
app.listen(PORT, () => console.log(`LLM Gateway running on port ${PORT}`));
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add LLM Gateway service"
```

---

## Phase 3: Agent Service

### 3.1 创建 Agent Service

- [ ] **Step 1: 创建 agent-service/package.json**

```json
{
  "name": "agent-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 创建 src/agents/base.ts**

```typescript
import axios from 'axios';

const LLM_GATEWAY_URL = process.env.LLM_GATEWAY_URL || 'http://llm-gateway:3002';

export interface AgentConfig {
  name: string;
  systemPrompt: string;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }

  protected async callLLM(messages: any[]): Promise<string> {
    const response = await axios.post(`${LLM_GATEWAY_URL}/v1/completions`, {
      model: 'gemini/gemini-1.5-pro',
      messages,
      temperature: 0.7,
    });
    return response.data.content;
  }

  protected buildMessages(userMessage: string) {
    return [
      { role: 'system', content: this.config.systemPrompt },
      { role: 'user', content: userMessage },
    ];
  }

  async execute(input: string): Promise<string> {
    const messages = this.buildMessages(input);
    return this.callLLM(messages);
  }
}
```

- [ ] **Step 3: 创建各智能体 (master, insight, segment, content, compliance, strategy, analyst)**

- [ ] **Step 4: 创建 src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { MasterAgent, InsightAgent, SegmentAgent, ContentAgent, ComplianceAgent, StrategyAgent, AnalystAgent } from './agents/index.js';

const app = express();
app.use(cors());
app.use(express.json());

const agents = {
  master: new MasterAgent(),
  insight: new InsightAgent(),
  segment: new SegmentAgent(),
  content: new ContentAgent(),
  compliance: new ComplianceAgent(),
  strategy: new StrategyAgent(),
  analyst: new AnalystAgent(),
};

app.post('/agents/:type', async (req, res) => {
  const { type } = req.params;
  const { prompt } = req.body;
  const agent = agents[type];
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  const result = await agent.execute(prompt);
  res.json({ result });
});

app.post('/agents/master/orchestrate', async (req, res) => {
  const { goal } = req.body;
  const agent = new MasterAgent();
  const result = await agent.orchestrate(goal);
  res.json({ result });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Agent Service running on port ${PORT}`));
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Agent Service with LangChain agents"
```

---

## Phase 4: Data Service

### 4.1 创建 Data Service (Prisma)

- [ ] **Step 1: 创建 data-service/package.json 和 prisma schema**

- [ ] **Step 2: 创建 CRUD 路由**

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Data Service with Prisma"
```

---

## Phase 5: 集成测试

### 5.1 端到端测试

- [ ] **Step 1: 启动所有服务**

```bash
docker-compose up -d
```

- [ ] **Step 2: 测试 Kong 路由**

```bash
curl http://localhost:8000/api/agents/master \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"goal":"推广新基金"}'
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "test: add integration tests"
```

---

## 验证步骤

1. `docker-compose up -d`
2. `curl http://localhost:8000/health`
3. 测试智能体调用
