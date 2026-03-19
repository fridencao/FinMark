import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS } from '../prompts/index.js';

export class SegmentAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Segment Agent',
      description: '客群筛选智能体',
      systemPrompt: PROMPTS.segment.system,
      temperature: 0.3,
    });
  }

  async generate(insightResult: string, goal: string): Promise<AgentResult> {
    try {
      const prompt = PROMPTS.segment.user(insightResult, goal);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);
      return { content: result.content, data, usage: result.usage };
    } catch (err: unknown) {
      return { content: '', error: err instanceof Error ? err.message : String(err) };
    }
  }

  async* streamGenerate(insightResult: string, goal: string): AsyncGenerator<string> {
    const prompt = PROMPTS.segment.user(insightResult, goal);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
