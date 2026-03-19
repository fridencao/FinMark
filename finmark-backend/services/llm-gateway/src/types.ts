import { z } from 'zod';

export const LLMRequestSchema = z.object({
  model: z.string().default('gemini-2.5-flash'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(32768).default(8192),
  stream: z.boolean().default(false),
  thinkingBudget: z.number().optional(),
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
