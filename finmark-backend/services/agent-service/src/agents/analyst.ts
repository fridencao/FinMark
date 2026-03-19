import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS } from '../prompts/index.js';

export class AnalystAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Analyst Agent',
      description: '效果评估智能体',
      systemPrompt: PROMPTS.analyst.system,
      temperature: 0.3,
    });
  }

  async evaluate(strategyResult: string, executionData?: string): Promise<AgentResult> {
    try {
      const prompt = PROMPTS.analyst.user(strategyResult, executionData);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);
      return { content: result.content, data, usage: result.usage };
    } catch (err: unknown) {
      return { content: '', error: err instanceof Error ? err.message : String(err) };
    }
  }

  async* streamEvaluate(strategyResult: string, executionData?: string): AsyncGenerator<string> {
    const prompt = PROMPTS.analyst.user(strategyResult, executionData);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
