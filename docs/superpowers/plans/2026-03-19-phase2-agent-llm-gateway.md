# Phase 2: LLM Gateway + Agent Service

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 LLM 网关和 6 个智能体（洞察、客群、内容、合规、策略、评估）+ 主智能体编排，支持流式输出

**Architecture:**
- LLM Gateway Service: 统一调用 Google Gemini SDK (@google/genai)
- Agent Service: 6 个专用智能体 + 主智能体编排
- 两服务可通过内部 HTTP 通信，也可在同一进程中运行
- 支持流式输出 (SSE/Server-Sent Events)

**Tech Stack:** Node.js, Express, TypeScript, @google/genai, zod

**依赖:** Phase 1 完成的 Data Service

---

## 目录结构

```
finmark-backend/
├── services/
│   ├── llm-gateway/              # LLM 网关服务
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── geminiClient.ts   # Gemini SDK 封装
│   │       └── types.ts
│   │
│   └── agent-service/             # 智能体服务
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── agents/
│           │   ├── base.ts
│           │   ├── master.ts      # 主智能体 (营销总监)
│           │   ├── insight.ts     # 洞察智能体
│           │   ├── segment.ts      # 客群智能体
│           │   ├── content.ts      # 内容智能体
│           │   ├── compliance.ts   # 合规智能体
│           │   ├── strategy.ts     # 策略智能体
│           │   ├── analyst.ts      # 评估智能体
│           │   └── index.ts
│           ├── prompts/           # 提示词模板
│           │   └── index.ts
│           └── types/
│               └── index.ts
```

---

## Chunk 1: LLM Gateway Service

### 1.1 创建 LLM Gateway Service

- [ ] **Step 1: 创建目录和 package.json**

```bash
mkdir -p finmark-backend/services/llm-gateway/src
```

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
    "@google/genai": "^1.29.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 创建 services/llm-gateway/src/types.ts**

```typescript
import { z } from 'zod';

export const LLMRequestSchema = z.object({
  model: z.string().default('gemini-3-flash-preview'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(32768).default(8192),
  stream: z.boolean().default(false),
  thinkingBudget: z.number().optional(), // Gemini thinking budget
});

export type LLMRequest = z.infer<typeof LLMRequestSchema>;

export interface LLMResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: LLMResponse['usage'];
}
```

- [ ] **Step 3: 创建 services/llm-gateway/src/geminiClient.ts**

```typescript
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

if (!apiKey) {
  console.warn('[LLM Gateway] WARNING: GEMINI_API_KEY not set. Running in mock mode.');
}

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  thinkingBudget?: number;
  responseSchema?: any;
}

export async function generateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<{ content: string; usage?: any }> {
  if (!ai) {
    // Mock 模式
    return { content: getMockResponse(prompt), usage: { totalTokens: 100 } };
  }

  const {
    systemInstruction,
    temperature = 0.7,
    maxTokens = 8192,
    thinkingBudget,
    responseSchema,
  } = options;

  try {
    const config: any = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (thinkingBudget) {
      config.thinkingConfig = { thinkingBudget };
    }

    if (responseSchema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = responseSchema;
    }

    const contents = systemInstruction
      ? {
          parts: [
            { text: `[System]: ${systemInstruction}\n\n[User]: ${prompt}` },
          ],
        }
      : { parts: [{ text: prompt }] };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config,
    });

    return {
      content: response.text || '',
      usage: {
        promptTokens: Number(response.usageMetadata?.promptTokenCount || 0),
        completionTokens: Number(response.usageMetadata?.candidatesTokenCount || 0),
        totalTokens: Number(response.usageMetadata?.totalTokenCount || 0),
      },
    };
  } catch (error: any) {
    console.error('[LLM Gateway] generateContent error:', error?.message);
    throw new Error(`LLM generation failed: ${error?.message}`);
  }
}

export async function* streamContent(
  prompt: string,
  options: GenerateOptions = {}
): AsyncGenerator<string> {
  if (!ai) {
    // Mock 流式输出
    const mock = getMockResponse(prompt);
    for (const char of mock) {
      yield char;
      await sleep(10);
    }
    return;
  }

  const {
    systemInstruction,
    temperature = 0.7,
    maxTokens = 8192,
    thinkingBudget,
  } = options;

  try {
    const config: any = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (thinkingBudget) {
      config.thinkingConfig = { thinkingBudget };
    }

    const contents = systemInstruction
      ? {
          parts: [
            { text: `[System]: ${systemInstruction}\n\n[User]: ${prompt}` },
          ],
        }
      : { parts: [{ text: prompt }] };

    const response = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents,
      config,
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error('[LLM Gateway] streamContent error:', error?.message);
    throw new Error(`LLM stream failed: ${error?.message}`);
  }
}

// Mock 响应 (无 API Key 时)
function getMockResponse(prompt: string): string {
  if (prompt.includes('洞察') || prompt.includes('insight')) {
    return '## 客户洞察分析\n\n- **目标客群**: 高净值理财客户\n- **流失风险**: 中 (25%)\n- **营销时机**: 月末是最佳窗口期';
  }
  if (prompt.includes('客群') || prompt.includes('segment')) {
    return '## 客群筛选条件\n\n```json\n{"aum": {"gte": 500000}, "age": {"between": [30, 55]}}\n```\n\n预计覆盖: 8,500 人';
  }
  if (prompt.includes('内容') || prompt.includes('content')) {
    return '## 营销文案\n\n尊敬的客户，您的专属理财方案已生成...';
  }
  if (prompt.includes('合规') || prompt.includes('compliance')) {
    return '## 合规审查\n\n✅ 无违禁词\n⚠️ 建议增加风险提示';
  }
  if (prompt.includes('策略') || prompt.includes('strategy')) {
    return '## 触达策略\n\n1. Day 1: 短信触达\n2. Day 3: APP 推送\n3. Day 7: 客户经理电话';
  }
  if (prompt.includes('评估') || prompt.includes('analyst')) {
    return '## 效果预估\n\n| 指标 | 预估值 |\n|------|--------|\n| 触达率 | 65% |\n| ROI | 2.8x |';
  }
  return '## 分析结果\n\n基于您的目标，建议采取以下方案...';
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: 创建 services/llm-gateway/src/index.ts**

```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generateContent, streamContent } from './geminiClient.js';
import { LLMRequestSchema } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'llm-gateway', model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview' });
});

// POST /v1/completions - 非流式生成
app.post('/v1/completions', async (req, res, next) => {
  try {
    const parsed = LLMRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { messages, temperature, maxTokens, model: _model } = parsed.data;
    
    // 合并 messages 为单个 prompt
    const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
    const userMessages = messages.filter(m => m.role !== 'system');
    const prompt = userMessages.map(m => `[${m.role}]: ${m.content}`).join('\n');
    const systemInstruction = systemParts.join('\n\n');

    const result = await generateContent(prompt, {
      systemInstruction,
      temperature,
      maxTokens,
    });

    res.json({
      id: `gen-${Date.now()}`,
      model: _model,
      content: result.content,
      finishReason: 'stop',
      usage: result.usage,
    });
  } catch (err: any) {
    next(err);
  }
});

// POST /v1/stream - 流式生成 (SSE)
app.post('/v1/stream', async (req, res, next) => {
  try {
    const parsed = LLMRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { messages, temperature, maxTokens } = parsed.data;

    const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
    const userMessages = messages.filter(m => m.role !== 'system');
    const prompt = userMessages.map(m => `[${m.role}]: ${m.content}`).join('\n');
    const systemInstruction = systemParts.join('\n\n');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let totalContent = '';
    for await (const chunk of streamContent(prompt, { systemInstruction, temperature, maxTokens })) {
      totalContent += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true, content: totalContent })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('[LLM Gateway] Stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

const PORT = process.env.LLM_PORT || 3002;
app.listen(PORT, () => {
  console.log(`LLM Gateway running on http://localhost:${PORT}`);
});

export default app;
```

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase2): add LLM Gateway Service with Gemini SDK"
```

---

## Chunk 2: Agent Service 基础

### 2.1 创建 Agent Service 目录和基础类

- [ ] **Step 1: 创建目录和 package.json**

```bash
mkdir -p finmark-backend/services/agent-service/src/{agents,prompts,types}
```

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
    "axios": "^1.7.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0"
  }
}
```

### 2.2 创建提示词模板

- [ ] **Step 2: 创建 services/agent-service/src/prompts/index.ts**

```typescript
// 中文提示词模板
export const PROMPTS_ZH = {
  master: {
    system: `你是一个金融营销总监。你的职责是：
1. 理解用户的营销目标
2. 将目标分解为可执行的子任务
3. 协调各智能体工作
4. 汇总结果并输出完整方案

输出格式：直接输出 Markdown 格式的方案，包含目标拆解、执行计划、风险提示。`,
    user: (goal: string) => `营销目标: ${goal}\n\n请分解这个目标并输出执行方案。`,
  },
  insight: {
    system: `你是一个金融客户洞察专家。请分析以下营销目标，识别：
1. 目标客群特征
2. 潜在流失风险
3. 最佳营销时机
4. 推荐客户标签

请简洁地提供深度见解和风险预警，输出 Markdown 格式。`,
    user: (goal: string, context?: string) => `营销目标: ${goal}\n\n${context ? `上下文: ${context}\n\n` : ''}请给出洞察分析。`,
  },
  segment: {
    system: `你是一个精准客群专家。请根据洞察结果，生成：
1. 客户筛选条件（标签、AUM、年龄、风险等级等）
2. 预计覆盖客户数量
3. 客群画像描述

输出格式：Markdown + 结构化 JSON。
重要：如果客户规模超过 10 万，请提醒设置上限。`,
    user: (insightResult: string, goal: string) => `营销目标: ${goal}\n\n洞察结果:\n${insightResult}\n\n请生成客群筛选条件。`,
  },
  content: {
    system: `你是一个金融文案专家。请根据客群画像和营销目标，生成：
1. 默认 3 组不同风格的营销文案
2. 每组文案适配的渠道（短信/企微/APP）
3. 文案变量（客户姓名、产品名称、权益信息等）

输出格式：Markdown + 结构化 JSON。
注意：自动适配不同渠道的内容长度限制，避免违禁词。`,
    user: (segmentResult: string, goal: string, channels: string[]) => `营销目标: ${goal}\n\n客群结果:\n${segmentResult}\n\n目标渠道: ${channels.join(', ')}\n\n请生成营销文案。`,
  },
  compliance: {
    system: `你是一个金融合规审查专家。请审查文案：
1. 检查违禁词（保本保息、绝对收益等）
2. 校验风险等级匹配
3. 审核话术合规性
4. 补充必要风险提示语

像审计员一样严格，高亮违禁词并给出修改建议。
输出格式：Markdown + 结构化 JSON。`,
    user: (content: string, riskLevels?: string) => `待审核文案:\n${content}\n\n${riskLevels ? `客群风险等级分布: ${riskLevels}\n\n` : ''}请进行合规审查。`,
  },
  strategy: {
    system: `你是一个营销策略专家。请制定触达方案：
1. 多渠道触达路径（优先级排序）
2. 触达时间节点
3. 预算分配建议
4. 预期触达率和 ROI

支持定时/周期/事件任务，支持 A/B 测试版本生成。
输出格式：Markdown + 结构化 JSON。`,
    user: (complianceResult: string, budget: number, channels: string[]) => `合规审查结果:\n${complianceResult}\n\n预算: ¥${budget}\n\n可用渠道: ${channels.join(', ')}\n\n请制定触达策略。`,
  },
  analyst: {
    system: `你是一个营销效果评估专家。请分析：
1. 核心指标（触达率、响应率、转化率、ROI）
2. 异常检测（指标偏离告警）
3. 优化建议

支持实时监控、历史对比、归因分析。
输出格式：Markdown + 结构化 JSON。`,
    user: (strategyResult: string, executionData?: string) => `策略结果:\n${strategyResult}\n\n${executionData ? `执行数据:\n${executionData}\n\n` : ''}请进行效果评估。`,
  },
};

// 英文提示词模板 (同结构)
export const PROMPTS_EN = {
  master: {
    system: `You are a financial marketing director. Your responsibilities are to:
1. Understand user marketing goals
2. Break down goals into actionable tasks
3. Coordinate multiple agents
4. Summarize results into a complete plan

Output format: Markdown with goal breakdown, execution plan, and risk warnings.`,
    user: (goal: string) => `Marketing goal: ${goal}\n\nPlease break down this goal and provide an execution plan.`,
  },
  // ... 其他智能体同结构
};
```

### 2.3 创建基础智能体类

- [ ] **Step 3: 创建 services/agent-service/src/agents/base.ts**

```typescript
import axios from 'axios';

const LLM_GATEWAY_URL = process.env.LLM_GATEWAY_URL || 'http://localhost:3002';

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResult {
  content: string;
  data?: any;
  usage?: any;
  error?: string;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected lang: 'zh' | 'en' = 'zh';

  constructor(config: AgentConfig) {
    this.config = config;
  }

  setLanguage(lang: 'zh' | 'en') {
    this.lang = lang;
  }

  protected async callLLM(
    prompt: string,
    options: { stream?: boolean; temperature?: number } = {}
  ): Promise<{ content: string; usage?: any }> {
    const { temperature = this.config.temperature ?? 0.7 } = options;

    try {
      const response = await axios.post(`${LLM_GATEWAY_URL}/v1/completions`, {
        model: 'gemini-3-flash-preview',
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        maxTokens: this.config.maxTokens ?? 8192,
      });

      return {
        content: response.data.content,
        usage: response.data.usage,
      };
    } catch (error: any) {
      console.error(`[${this.config.name}] LLM call failed:`, error?.message);
      throw new Error(`${this.config.name} failed: ${error?.message}`);
    }
  }

  protected async* streamLLM(prompt: string): AsyncGenerator<string> {
    const response = await axios.post(
      `${LLM_GATEWAY_URL}/v1/stream`,
      {
        model: 'gemini-3-flash-preview',
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 8192,
        stream: true,
      },
      { responseType: 'stream' }
    );

    const stream = response.data as AsyncIterable<Buffer>;
    const decoder = new TextDecoder();

    for await (const chunk of stream) {
      const lines = decoder.decode(chunk).split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.content) {
              yield data.content;
            }
            if (data.done) {
              return;
            }
          } catch {
            // 解析错误，跳过
          }
        }
      }
    }
  }

  // 尝试从 Markdown 中提取 JSON
  protected extractJSON(text: string): any | null {
    // 优先匹配 ```json ... ``` 中的内容
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // 继续尝试其他方式
      }
    }
    // 尝试直接解析整个文本
    try {
      return JSON.parse(text.trim());
    } catch {
      return null;
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

### 2.4 创建 6 个专用智能体

- [ ] **Step 4: 创建 Insight Agent**

```typescript
// services/agent-service/src/agents/insight.ts
import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS_ZH, PROMPTS_EN } from '../prompts/index.js';

export class InsightAgent extends BaseAgent {
  constructor() {
    const prompts = { zh: PROMPTS_ZH.insight, en: PROMPTS_EN.insight };
    super({
      name: 'Insight Agent',
      description: '客户洞察智能体',
      systemPrompt: prompts.zh.system,
      temperature: 0.4,
    });
  }

  async analyze(goal: string, context?: string): Promise<AgentResult> {
    try {
      const prompts = this.lang === 'zh' ? PROMPTS_ZH.insight : PROMPTS_EN.insight;
      const prompt = prompts.user(goal, context);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);

      return { content: result.content, data, usage: result.usage };
    } catch (err: any) {
      return { content: '', error: err.message };
    }
  }

  async* streamAnalyze(goal: string, context?: string): AsyncGenerator<string> {
    const prompts = this.lang === 'zh' ? PROMPTS_ZH.insight : PROMPTS_EN.insight;
    const prompt = prompts.user(goal, context);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
```

- [ ] **Step 5: 创建 Segment Agent**

```typescript
// services/agent-service/src/agents/segment.ts
import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS_ZH, PROMPTS_EN } from '../prompts/index.js';

export class SegmentAgent extends BaseAgent {
  constructor() {
    const prompts = { zh: PROMPTS_ZH.segment, en: PROMPTS_EN.segment };
    super({
      name: 'Segment Agent',
      description: '客群筛选智能体',
      systemPrompt: prompts.zh.system,
      temperature: 0.3,
    });
  }

  async generate(insightResult: string, goal: string): Promise<AgentResult> {
    try {
      const prompts = this.lang === 'zh' ? PROMPTS_ZH.segment : PROMPTS_EN.segment;
      const prompt = prompts.user(insightResult, goal);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);

      return { content: result.content, data, usage: result.usage };
    } catch (err: any) {
      return { content: '', error: err.message };
    }
  }

  async* streamGenerate(insightResult: string, goal: string): AsyncGenerator<string> {
    const prompts = this.lang === 'zh' ? PROMPTS_ZH.segment : PROMPTS_EN.segment;
    const prompt = prompts.user(insightResult, goal);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
```

- [ ] **Step 6: 创建 Content Agent**

```typescript
// services/agent-service/src/agents/content.ts
import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS_ZH, PROMPTS_EN } from '../prompts/index.js';

export class ContentAgent extends BaseAgent {
  constructor() {
    const prompts = { zh: PROMPTS_ZH.content, en: PROMPTS_EN.content };
    super({
      name: 'Content Agent',
      description: '营销文案智能体',
      systemPrompt: prompts.zh.system,
      temperature: 0.7,
    });
  }

  async generate(
    segmentResult: string,
    goal: string,
    channels: string[] = ['短信', '企微', 'APP']
  ): Promise<AgentResult> {
    try {
      const prompts = this.lang === 'zh' ? PROMPTS_ZH.content : PROMPTS_EN.content;
      const prompt = prompts.user(segmentResult, goal, channels);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);

      return { content: result.content, data, usage: result.usage };
    } catch (err: any) {
      return { content: '', error: err.message };
    }
  }

  async* streamGenerate(
    segmentResult: string,
    goal: string,
    channels: string[] = ['短信', '企微', 'APP']
  ): AsyncGenerator<string> {
    const prompts = this.lang === 'zh' ? PROMPTS_ZH.content : PROMPTS_EN.content;
    const prompt = prompts.user(segmentResult, goal, channels);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
```

- [ ] **Step 7: 创建 Compliance Agent**

```typescript
// services/agent-service/src/agents/compliance.ts
import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS_ZH, PROMPTS_EN } from '../prompts/index.js';

export class ComplianceAgent extends BaseAgent {
  constructor() {
    const prompts = { zh: PROMPTS_ZH.compliance, en: PROMPTS_EN.compliance };
    super({
      name: 'Compliance Agent',
      description: '合规审查智能体',
      systemPrompt: prompts.zh.system,
      temperature: 0.2,
    });
  }

  async review(content: string, riskLevels?: string): Promise<AgentResult> {
    try {
      const prompts = this.lang === 'zh' ? PROMPTS_ZH.compliance : PROMPTS_EN.compliance;
      const prompt = prompts.user(content, riskLevels);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);

      return { content: result.content, data, usage: result.usage };
    } catch (err: any) {
      return { content: '', error: err.message };
    }
  }

  async* streamReview(content: string, riskLevels?: string): AsyncGenerator<string> {
    const prompts = this.lang === 'zh' ? PROMPTS_ZH.compliance : PROMPTS_EN.compliance;
    const prompt = prompts.user(content, riskLevels);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
```

- [ ] **Step 8: 创建 Strategy Agent**

```typescript
// services/agent-service/src/agents/strategy.ts
import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS_ZH, PROMPTS_EN } from '../prompts/index.js';

export class StrategyAgent extends BaseAgent {
  constructor() {
    const prompts = { zh: PROMPTS_ZH.strategy, en: PROMPTS_EN.strategy };
    super({
      name: 'Strategy Agent',
      description: '触达策略智能体',
      systemPrompt: prompts.zh.system,
      temperature: 0.5,
    });
  }

  async plan(
    complianceResult: string,
    budget: number,
    channels: string[] = ['短信', '企微', 'APP', '外呼']
  ): Promise<AgentResult> {
    try {
      const prompts = this.lang === 'zh' ? PROMPTS_ZH.strategy : PROMPTS_EN.strategy;
      const prompt = prompts.user(complianceResult, budget, channels);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);

      return { content: result.content, data, usage: result.usage };
    } catch (err: any) {
      return { content: '', error: err.message };
    }
  }

  async* streamPlan(
    complianceResult: string,
    budget: number,
    channels: string[] = ['短信', '企微', 'APP', '外呼']
  ): AsyncGenerator<string> {
    const prompts = this.lang === 'zh' ? PROMPTS_ZH.strategy : PROMPTS_EN.strategy;
    const prompt = prompts.user(complianceResult, budget, channels);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
```

- [ ] **Step 9: 创建 Analyst Agent**

```typescript
// services/agent-service/src/agents/analyst.ts
import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS_ZH, PROMPTS_EN } from '../prompts/index.js';

export class AnalystAgent extends BaseAgent {
  constructor() {
    const prompts = { zh: PROMPTS_ZH.analyst, en: PROMPTS_EN.analyst };
    super({
      name: 'Analyst Agent',
      description: '效果评估智能体',
      systemPrompt: prompts.zh.system,
      temperature: 0.3,
    });
  }

  async evaluate(strategyResult: string, executionData?: string): Promise<AgentResult> {
    try {
      const prompts = this.lang === 'zh' ? PROMPTS_ZH.analyst : PROMPTS_EN.analyst;
      const prompt = prompts.user(strategyResult, executionData);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);

      return { content: result.content, data, usage: result.usage };
    } catch (err: any) {
      return { content: '', error: err.message };
    }
  }

  async* streamEvaluate(strategyResult: string, executionData?: string): AsyncGenerator<string> {
    const prompts = this.lang === 'zh' ? PROMPTS_ZH.analyst : PROMPTS_EN.analyst;
    const prompt = prompts.user(strategyResult, executionData);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
```

- [ ] **Step 10: 创建 Master Agent (编排器)**

```typescript
// services/agent-service/src/agents/master.ts
import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS_ZH, PROMPTS_EN } from '../prompts/index.js';
import { InsightAgent, SegmentAgent, ContentAgent, ComplianceAgent, StrategyAgent, AnalystAgent } from './index.js';

export interface OrchestrationContext {
  goal: string;
  budget?: number;
  channels?: string[];
  lang?: 'zh' | 'en';
}

export class MasterAgent extends BaseAgent {
  private insight = new InsightAgent();
  private segment = new SegmentAgent();
  private content = new ContentAgent();
  private compliance = new ComplianceAgent();
  private strategy = new StrategyAgent();
  private analyst = new AnalystAgent();

  constructor() {
    const prompts = { zh: PROMPTS_ZH.master, en: PROMPTS_EN.master };
    super({
      name: 'Master Agent',
      description: '营销总监 - 智能体编排器',
      systemPrompt: prompts.zh.system,
      temperature: 0.5,
    });
  }

  setLanguage(lang: 'zh' | 'en') {
    this.lang = lang;
    this.insight.setLanguage(lang);
    this.segment.setLanguage(lang);
    this.content.setLanguage(lang);
    this.compliance.setLanguage(lang);
    this.strategy.setLanguage(lang);
    this.analyst.setLanguage(lang);
  }

  async orchestrate(context: OrchestrationContext): Promise<{
    master: AgentResult;
    insight?: AgentResult;
    segment?: AgentResult;
    content?: AgentResult;
    compliance?: AgentResult;
    strategy?: AgentResult;
    analyst?: AgentResult;
  }> {
    this.setLanguage(context.lang || 'zh');
    const results: any = { master: null };

    try {
      // 1. 洞察
      results.insight = await this.insight.analyze(context.goal);

      // 2. 客群
      results.segment = await this.segment.generate(
        results.insight.content,
        context.goal
      );

      // 3. 内容
      results.content = await this.content.generate(
        results.segment.content,
        context.goal,
        context.channels || ['短信', '企微', 'APP']
      );

      // 4. 合规
      results.compliance = await this.compliance.review(results.content.content);

      // 5. 策略
      results.strategy = await this.strategy.plan(
        results.compliance.content,
        context.budget || 10000,
        context.channels || ['短信', '企微', 'APP', '外呼']
      );

      // 6. 评估
      results.analyst = await this.analyst.evaluate(results.strategy.content);

      // 主智能体汇总
      const prompts = this.lang === 'zh' ? PROMPTS_ZH.master : PROMPTS_EN.master;
      const summary = await this.callLLM(
        `请汇总以下各智能体的输出，生成一份完整的营销执行方案。\n\n` +
        `【洞察】:\n${results.insight.content}\n\n` +
        `【客群】:\n${results.segment.content}\n\n` +
        `【内容】:\n${results.content.content}\n\n` +
        `【合规】:\n${results.compliance.content}\n\n` +
        `【策略】:\n${results.strategy.content}\n\n` +
        `【评估】:\n${results.analyst.content}`
      );
      results.master = { content: summary.content, usage: summary.usage };

      return results;
    } catch (err: any) {
      console.error('[Master Agent] Orchestration failed:', err);
      return {
        master: { content: '', error: err.message },
        ...results,
      };
    }
  }

  async* streamOrchestrate(context: OrchestrationContext): AsyncGenerator<{
    agent: string;
    chunk: string;
    done: boolean;
  }> {
    this.setLanguage(context.lang || 'zh');

    try {
      // 流式执行洞察
      yield { agent: 'insight', chunk: '开始洞察分析...\n', done: false };
      let insightContent = '';
      for await (const chunk of this.insight.streamAnalyze(context.goal)) {
        insightContent += chunk;
        yield { agent: 'insight', chunk, done: false };
      }
      yield { agent: 'insight', chunk: '\n\n', done: true };

      // 流式执行客群
      yield { agent: 'segment', chunk: '开始客群筛选...\n', done: false };
      let segmentContent = '';
      for await (const chunk of this.segment.streamGenerate(insightContent, context.goal)) {
        segmentContent += chunk;
        yield { agent: 'segment', chunk, done: false };
      }
      yield { agent: 'segment', chunk: '\n\n', done: true };

      // 流式执行内容
      yield { agent: 'content', chunk: '开始生成文案...\n', done: false };
      let contentResult = '';
      for await (const chunk of this.content.streamGenerate(
        segmentContent,
        context.goal,
        context.channels || ['短信', '企微', 'APP']
      )) {
        contentResult += chunk;
        yield { agent: 'content', chunk, done: false };
      }
      yield { agent: 'content', chunk: '\n\n', done: true };

      // 流式执行合规
      yield { agent: 'compliance', chunk: '开始合规审查...\n', done: false };
      let complianceResult = '';
      for await (const chunk of this.compliance.streamReview(contentResult)) {
        complianceResult += chunk;
        yield { agent: 'compliance', chunk, done: false };
      }
      yield { agent: 'compliance', chunk: '\n\n', done: true };

      // 流式执行策略
      yield { agent: 'strategy', chunk: '开始制定策略...\n', done: false };
      let strategyResult = '';
      for await (const chunk of this.strategy.streamPlan(
        complianceResult,
        context.budget || 10000,
        context.channels || ['短信', '企微', 'APP', '外呼']
      )) {
        strategyResult += chunk;
        yield { agent: 'strategy', chunk, done: false };
      }
      yield { agent: 'strategy', chunk: '\n\n', done: true };

      // 流式执行评估
      yield { agent: 'analyst', chunk: '开始效果评估...\n', done: false };
      for await (const chunk of this.analyst.streamEvaluate(strategyResult)) {
        yield { agent: 'analyst', chunk, done: false };
      }
      yield { agent: 'analyst', chunk: '', done: true };

      yield { agent: 'master', chunk: '✅ 方案生成完成', done: true };
    } catch (err: any) {
      yield { agent: 'error', chunk: err.message, done: true };
    }
  }
}
```

- [ ] **Step 11: 创建 agents/index.ts**

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

- [ ] **Step 12: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase2): add all 6 agents and master orchestrator"
```

---

## Chunk 3: Agent Service API

### 3.1 创建 API 路由

- [ ] **Step 1: 创建 services/agent-service/src/index.ts**

```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  MasterAgent, InsightAgent, SegmentAgent,
  ContentAgent, ComplianceAgent, StrategyAgent, AnalystAgent,
} from './agents/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// Agent instances
const master = new MasterAgent();
const insight = new InsightAgent();
const segment = new SegmentAgent();
const content = new ContentAgent();
const compliance = new ComplianceAgent();
const strategy = new StrategyAgent();
const analyst = new AnalystAgent();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-service' });
});

// POST /agents/insight - 洞察智能体
app.post('/agents/insight', async (req, res, next) => {
  try {
    const { goal, context, lang = 'zh' } = req.body;
    insight.setLanguage(lang);
    const result = await insight.analyze(goal, context);
    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// POST /agents/segment - 客群智能体
app.post('/agents/segment', async (req, res, next) => {
  try {
    const { insightResult, goal, lang = 'zh' } = req.body;
    segment.setLanguage(lang);
    const result = await segment.generate(insightResult, goal);
    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// POST /agents/content - 内容智能体
app.post('/agents/content', async (req, res, next) => {
  try {
    const { segmentResult, goal, channels, lang = 'zh' } = req.body;
    content.setLanguage(lang);
    const result = await content.generate(segmentResult, goal, channels);
    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// POST /agents/compliance - 合规智能体
app.post('/agents/compliance', async (req, res, next) => {
  try {
    const { content: contentText, riskLevels, lang = 'zh' } = req.body;
    compliance.setLanguage(lang);
    const result = await compliance.review(contentText, riskLevels);
    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// POST /agents/strategy - 策略智能体
app.post('/agents/strategy', async (req, res, next) => {
  try {
    const { complianceResult, budget, channels, lang = 'zh' } = req.body;
    strategy.setLanguage(lang);
    const result = await strategy.plan(complianceResult, budget, channels);
    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// POST /agents/analyst - 评估智能体
app.post('/agents/analyst', async (req, res, next) => {
  try {
    const { strategyResult, executionData, lang = 'zh' } = req.body;
    analyst.setLanguage(lang);
    const result = await analyst.evaluate(strategyResult, executionData);
    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// POST /agents/master - 主智能体编排
app.post('/agents/master', async (req, res, next) => {
  try {
    const { goal, budget, channels, lang = 'zh' } = req.body;
    const result = await master.orchestrate({ goal, budget, channels, lang });
    res.json({ success: true, data: result });
  } catch (err: any) {
    next(err);
  }
});

// POST /agents/master/stream - 流式编排 (SSE)
app.post('/agents/master/stream', async (req, res, next) => {
  try {
    const { goal, budget, channels, lang = 'zh' } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    for await (const event of master.streamOrchestrate({ goal, budget, channels, lang })) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      // 刷新缓冲区
      if (res.flush) res.flush();
    }
    res.end();
  } catch (err: any) {
    console.error('[Agent Service] Stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ agent: 'error', chunk: err.message, done: true })}\n\n`);
      res.end();
    }
  }
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Agent Service Error]', err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.AGENT_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Agent Service running on http://localhost:${PORT}`);
});

export default app;
```

- [ ] **Step 2: 更新根 package.json 添加新服务**

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel -filter '*/service' dev",
    "dev:llm": "pnpm --filter llm-gateway dev",
    "dev:agent": "pnpm --filter agent-service dev",
    "dev:data": "pnpm --filter data-service dev"
  }
}
```

- [ ] **Step 3: 启动并测试 Agent Service**

```bash
cd finmark-backend
# 先启动 LLM Gateway (需要 GEMINI_API_KEY)
GEMINI_API_KEY=your-key LLM_PORT=3002 pnpm dev:llm

# 新终端 - 启动 Agent Service
AGENT_PORT=3003 LLM_GATEWAY_URL=http://localhost:3002 pnpm dev:agent
```

- [ ] **Step 4: 测试 API**

```bash
# 测试健康检查
curl http://localhost:3003/health

# 测试洞察智能体 (需要 LLM Gateway 运行)
curl -X POST http://localhost:3003/agents/insight \
  -H "Content-Type: application/json" \
  -d '{"goal":"推广新发基金","lang":"zh"}'

# 测试主智能体编排 (Mock 模式，无需 API Key)
curl -X POST http://localhost:3003/agents/master \
  -H "Content-Type: application/json" \
  -d '{"goal":"提升高净值客户理财产品转化率","budget":50000,"lang":"zh"}'
```

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase2): add Agent Service API with streaming support"
```

---

## Chunk 4: 端到端集成测试

### 4.1 创建集成测试脚本

- [ ] **Step 1: 创建集成测试**

```typescript
// services/agent-service/test/integration.test.ts
// 使用 Node.js 内置 test runner

import { MasterAgent, InsightAgent } from '../src/agents/index.js';

async function testAgents() {
  console.log('=== Agent Service Integration Tests ===\n');

  // Test 1: Insight Agent
  console.log('Test 1: Insight Agent');
  const insight = new InsightAgent();
  insight.setLanguage('zh');
  const insightResult = await insight.analyze('推广新发ESG基金');
  console.log('✓ Insight result:', insightResult.content.slice(0, 100) + '...');
  console.assert(!insightResult.error, 'Insight should not error');

  // Test 2: Segment Agent
  console.log('\nTest 2: Segment Agent');
  const segment = new SegmentAgent();
  segment.setLanguage('zh');
  const segmentResult = await segment.generate(insightResult.content, '推广新发基金');
  console.log('✓ Segment result:', segmentResult.content.slice(0, 100) + '...');
  console.assert(!segmentResult.error, 'Segment should not error');

  // Test 3: Master Agent Orchestration
  console.log('\nTest 3: Master Agent Orchestration');
  const master = new MasterAgent();
  const orchestration = await master.orchestrate({
    goal: '提升本季度高净值客户理财产品转化率',
    budget: 50000,
    channels: ['短信', '企微', 'APP'],
    lang: 'zh',
  });
  console.log('✓ Orchestration complete');
  console.log('  - Master:', orchestration.master?.content?.slice(0, 50) + '...');
  console.log('  - Insight:', orchestration.insight?.content?.slice(0, 50) + '...');
  console.log('  - Segment:', orchestration.segment?.content?.slice(0, 50) + '...');
  console.log('  - Content:', orchestration.content?.content?.slice(0, 50) + '...');
  console.log('  - Compliance:', orchestration.compliance?.content?.slice(0, 50) + '...');
  console.log('  - Strategy:', orchestration.strategy?.content?.slice(0, 50) + '...');
  console.log('  - Analyst:', orchestration.analyst?.content?.slice(0, 50) + '...');

  console.log('\n=== All tests passed! ===');
}

testAgents().catch(console.error);
```

运行测试:

```bash
cd finmark-backend/services/agent-service
npx tsx test/integration.test.ts
```

- [ ] **Step 2: Commit**

```bash
git add finmark-backend/
git commit -m "test(phase2): add agent service integration tests"
```

---

## 验证清单

- [ ] `pnpm dev:llm` LLM Gateway 启动成功
- [ ] `pnpm dev:agent` Agent Service 启动成功
- [ ] GET `/health` 两服务都返回 ok
- [ ] POST `/agents/insight` 返回洞察分析
- [ ] POST `/agents/master` 返回完整编排结果
- [ ] POST `/agents/master/stream` 返回 SSE 流式输出
- [ ] 无 API Key 时返回 Mock 响应
- [ ] 所有智能体支持中英文
- [ ] 错误处理正常 (API 失败返回 500 + 错误信息)
- [ ] 集成测试全部通过

---

## Docker Compose 更新

更新 `finmark-backend/docker-compose.yml` 添加新服务:

```yaml
services:
  # ... postgres + redis

  llm-gateway:
    build:
      context: ./services/llm-gateway
    ports:
      - "3002:3002"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      LLM_PORT: 3002
    depends_on:
      - postgres
      - redis

  agent-service:
    build:
      context: ./services/agent-service
    ports:
      - "3003:3003"
    environment:
      LLM_GATEWAY_URL: http://llm-gateway:3002
      AGENT_PORT: 3003
    depends_on:
      - llm-gateway
```

---

## 已知限制与 TODO

1. **无消息队列**: 执行场景目前是同步的，大型场景可能超时。后续需要接入 Redis/BullMQ 实现异步执行。
2. **无重试机制**: LLM 调用失败无自动重试。后续添加指数退避重试。
3. **无限流保护**: Agent Service 未实现请求限流。后续由 Kong 处理。
4. **提示词待优化**: 当前提示词为基础版本，需要根据实际使用反馈迭代调优。
