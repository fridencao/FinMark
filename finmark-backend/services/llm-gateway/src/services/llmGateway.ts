import { litellm } from 'litellm';

interface LLMRequest {
  model?: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  temperature?: number;
  maxTokens?: number;
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
      // 设置 API key
      if (process.env.GOOGLE_API_KEY) {
        process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
      }
      
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
      // 返回模拟响应用于开发
      return {
        id: 'mock-response',
        model: request.model || this.defaultModel,
        content: '这是 LLM Gateway 的模拟响应。在配置 API Key 后将返回真实响应。',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      };
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<string> {
    try {
      if (process.env.GOOGLE_API_KEY) {
        process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
      }
      
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
    } catch (error) {
      console.error('LLM Stream Error:', error);
      yield '这是 LLM Gateway 的模拟流式响应。';
    }
  }

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
