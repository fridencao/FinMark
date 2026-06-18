import { GoogleGenAI } from '@google/genai';
import type { GenerateOptions, GenerateResult, LLMProvider } from './types.js';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!apiKey) {
  console.warn('[GeminiProvider] GEMINI_API_KEY not set. Running in mock mode.');
}

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';

  async generateContent(
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    if (!ai) {
      return { content: getMockResponse(prompt), usage: { promptTokens: 0, completionTokens: 0, totalTokens: 100 } };
    }

    const {
      systemInstruction,
      temperature = 0.7,
      maxTokens = 8192,
      thinkingBudget,
    } = options;

    try {
      const contents = [
        {
          parts: [
            { text: systemInstruction ? `[System]: ${systemInstruction}\n\n[User]: ${prompt}` : prompt },
          ],
        },
      ];

      const config: Record<string, unknown> = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      if (thinkingBudget) {
        config.thinkingConfig = { thinkingBudget };
      }

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[GeminiProvider] generateContent error:', err?.message);
      throw new Error(`Gemini generation failed: ${err?.message}`);
    }
  }

  async *streamContent(
    prompt: string,
    options: GenerateOptions = {},
  ): AsyncGenerator<string> {
    if (!ai) {
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
      const contents = [
        {
          parts: [
            { text: systemInstruction ? `[System]: ${systemInstruction}\n\n[User]: ${prompt}` : prompt },
          ],
        },
      ];

      const config: Record<string, unknown> = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      if (thinkingBudget) {
        config.thinkingConfig = { thinkingBudget };
      }

      const response = await ai.models.generateContentStream({
        model: DEFAULT_MODEL,
        contents,
        config,
      });

      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[GeminiProvider] streamContent error:', err?.message);
      throw new Error(`Gemini stream failed: ${err?.message}`);
    }
  }
}

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
