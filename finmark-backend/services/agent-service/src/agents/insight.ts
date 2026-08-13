import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS } from '../prompts/index.js';

export class InsightAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Insight Agent',
      description: '客户洞察智能体',
      systemPrompt: PROMPTS.insight.system,
      temperature: 0.4,
      agentType: 'insight',
    });
  }

  async analyze(goal: string, context?: string, model?: string): Promise<AgentResult> {
    try {
      const prompt = PROMPTS.insight.user(goal, context);
      const result = await this.callLLM(prompt, { model });
      const data = this.extractJSON(result.content);
      return { content: result.content, data, usage: result.usage };
    } catch (err: unknown) {
      return { content: '', error: err instanceof Error ? err.message : String(err) };
    }
  }

  async* streamAnalyze(goal: string, context?: string, model?: string): AsyncGenerator<string> {
    const prompt = PROMPTS.insight.user(goal, context);
    for await (const chunk of this.streamLLM(prompt, { model })) {
      yield chunk;
    }
  }
}
