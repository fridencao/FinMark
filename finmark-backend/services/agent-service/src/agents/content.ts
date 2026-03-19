import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS } from '../prompts/index.js';

export class ContentAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Content Agent',
      description: '营销文案智能体',
      systemPrompt: PROMPTS.content.system,
      temperature: 0.7,
    });
  }

  async generate(
    segmentResult: string,
    goal: string,
    channels: string[] = ['短信', '企微', 'APP']
  ): Promise<AgentResult> {
    try {
      const prompt = PROMPTS.content.user(segmentResult, goal, channels);
      const result = await this.callLLM(prompt);
      const data = this.extractJSON(result.content);
      return { content: result.content, data, usage: result.usage };
    } catch (err: unknown) {
      return { content: '', error: err instanceof Error ? err.message : String(err) };
    }
  }

  async* streamGenerate(
    segmentResult: string,
    goal: string,
    channels: string[] = ['短信', '企微', 'APP']
  ): AsyncGenerator<string> {
    const prompt = PROMPTS.content.user(segmentResult, goal, channels);
    for await (const chunk of this.streamLLM(prompt)) {
      yield chunk;
    }
  }
}
