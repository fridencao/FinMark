import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS } from '../prompts/index.js';

export class StrategyAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Strategy Agent',
      description: '触达策略智能体',
      systemPrompt: PROMPTS.strategy.system,
      temperature: 0.5,
    });
  }

  async plan(
    complianceResult: string,
    budget: number,
    channels: string[] = ['短信', '企微', 'APP', '外呼']
  ): Promise<AgentResult> {
    try {
      const prompt = PROMPTS.strategy.user(complianceResult, budget, channels);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);
      return { content: result.content, data, usage: result.usage };
    } catch (err: unknown) {
      return { content: '', error: err instanceof Error ? err.message : String(err) };
    }
  }

  async* streamPlan(
    complianceResult: string,
    budget: number,
    channels: string[] = ['短信', '企微', 'APP', '外呼']
  ): AsyncGenerator<string> {
    const prompt = PROMPTS.strategy.user(complianceResult, budget, channels);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
