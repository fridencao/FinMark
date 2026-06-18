import type { GenerateOptions, GenerateResult, LLMProvider } from './types.js';

const API_KEY = process.env.OPENAI_API_KEY || '';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'deepseek-chat';

interface OpenAIStreamChunk {
  choices: {
    delta: { content?: string };
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIResponse {
  id: string;
  choices: {
    message: { content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_MSG = {
  role: 'system' as const,
  content: '',
};

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name = 'openai';

  private buildMessages(prompt: string, systemInstruction?: string) {
    const messages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });
    return messages;
  }

  async generateContent(
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    if (!API_KEY) {
      console.warn('[OpenAIProvider] OPENAI_API_KEY not set.');
      return {
        content: '请在 .env 中配置 OPENAI_API_KEY',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    }

    const {
      systemInstruction,
      temperature = 0.7,
      maxTokens = 8192,
    } = options;

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: this.buildMessages(prompt, systemInstruction),
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[OpenAIProvider] generateContent error:', err?.message);
      throw new Error(`OpenAI-compatible generation failed: ${err?.message}`);
    }
  }

  async *streamContent(
    prompt: string,
    options: GenerateOptions = {},
  ): AsyncGenerator<string> {
    if (!API_KEY) {
      yield '请在 .env 中配置 OPENAI_API_KEY';
      return;
    }

    const {
      systemInstruction,
      temperature = 0.7,
      maxTokens = 8192,
    } = options;

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: this.buildMessages(prompt, systemInstruction),
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('OpenAI API returned no response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') break;

          try {
            const chunk = JSON.parse(jsonStr) as OpenAIStreamChunk;
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[OpenAIProvider] streamContent error:', err?.message);
      throw new Error(`OpenAI-compatible stream failed: ${err?.message}`);
    }
  }
}
