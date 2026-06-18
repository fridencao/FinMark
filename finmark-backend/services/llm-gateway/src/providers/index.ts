import type { LLMProvider } from './types.js';
import { GeminiProvider } from './gemini.js';
import { OpenAICompatibleProvider } from './openai.js';

export type { LLMProvider, GenerateOptions, GenerateResult, StreamChunk } from './types.js';

function getProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

  switch (provider) {
    case 'openai':
    case 'deepseek':
      console.log(`[LLM Gateway] Using OpenAI-compatible provider (${provider})`);
      return new OpenAICompatibleProvider();
    case 'gemini':
    default:
      console.log('[LLM Gateway] Using Gemini provider');
      return new GeminiProvider();
  }
}

export const provider: LLMProvider = getProvider();
