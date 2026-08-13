import axios from 'axios';
import { getModelFor, type AgentType } from '../services/agentConfigClient.js';

const LLM_GATEWAY_URL = process.env.LLM_GATEWAY_URL || 'http://localhost:3002';

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  /** 持久化 agentType,启用 per-agent 模型绑定(查 data-service AgentConfig.modelId) */
  agentType?: AgentType;
}

export interface AgentResult {
  content: string;
  data?: unknown;
  usage?: unknown;
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

  setSystemPrompt(prompt: string) {
    this.config.systemPrompt = prompt;
  }

  /**
   * 解析最终使用的 model:
   *   1) 请求体显式 model(request-time override,优先级最高)
   *   2) data-service AgentConfig.modelId(per-agent 持久化绑定)
   *   3) hardcoded 'gemini-2.5-flash' 兜底
   * 失败/不可达不抛错,降级到下一步。
   */
  private async resolveModel(requestModel?: string): Promise<string> {
    if (requestModel && requestModel.length > 0) return requestModel;
    if (this.config.agentType) {
      const persisted = await getModelFor(this.config.agentType);
      if (persisted) return persisted;
    }
    return 'gemini-2.5-flash';
  }

  protected async callLLM(
    prompt: string,
    options: { stream?: boolean; temperature?: number; model?: string } = {}
  ): Promise<{ content: string; usage?: unknown }> {
    const temperature = options.temperature ?? this.config.temperature ?? 0.7;
    const model = await this.resolveModel(options.model);

    try {
      const response = await axios.post(`${LLM_GATEWAY_URL}/v1/completions`, {
        model,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        maxTokens: this.config.maxTokens ?? 8192,
      }, { timeout: 60000 });

      return {
        content: response.data.content,
        usage: response.data.usage,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[${this.config.name}] LLM call failed:`, err?.message);
      throw new Error(`${this.config.name} failed: ${err?.message}`);
    }
  }

  protected async* streamLLM(
    prompt: string,
    options: { temperature?: number; model?: string } = {}
  ): AsyncGenerator<string> {
    const model = await this.resolveModel(options.model);
    const response = await axios.post(
      `${LLM_GATEWAY_URL}/v1/stream`,
      {
        model,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 8192,
        stream: true,
      },
      { responseType: 'stream', timeout: 120000 }
    );

    const stream = response.data as AsyncIterable<Buffer>;
    const decoder = new TextDecoder();

    for await (const chunk of stream) {
      const lines = decoder.decode(chunk).split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.done) return;
            if (data.content) yield data.content;
          } catch {
          }
        }
      }
    }
  }

  protected extractJSON(text: string): unknown | null {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
      }
    }
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
