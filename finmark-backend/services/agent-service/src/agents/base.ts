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

  protected async callLLM(
    prompt: string,
    options: { stream?: boolean; temperature?: number } = {}
  ): Promise<{ content: string; usage?: unknown }> {
    const temperature = options.temperature ?? this.config.temperature ?? 0.7;

    try {
      const response = await axios.post(`${LLM_GATEWAY_URL}/v1/completions`, {
        model: 'gemini-2.5-flash',
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

  protected async* streamLLM(prompt: string): AsyncGenerator<string> {
    const response = await axios.post(
      `${LLM_GATEWAY_URL}/v1/stream`,
      {
        model: 'gemini-2.5-flash',
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
            if (data.content) yield data.content;
            if (data.done) return;
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
