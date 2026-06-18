export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  thinkingBudget?: number;
  responseSchema?: unknown;
}

export interface GenerateResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: GenerateResult['usage'];
}

export interface LLMProvider {
  readonly name: string;
  generateContent(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  streamContent(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
}
