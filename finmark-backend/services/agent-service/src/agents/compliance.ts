import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS } from '../prompts/index.js';

export class ComplianceAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Compliance Agent',
      description: '合规审查智能体',
      systemPrompt: PROMPTS.compliance.system,
      temperature: 0.2,
    });
  }

  async review(content: string, riskLevels?: string, model?: string): Promise<AgentResult> {
    try {
      const prompt = PROMPTS.compliance.user(content, riskLevels);
      const result = await this.callLLM(prompt, { model });
      const data = this.extractJSON(result.content);
      return { content: result.content, data, usage: result.usage };
    } catch (err: unknown) {
      return { content: '', error: err instanceof Error ? err.message : String(err) };
    }
  }

  async* streamReview(content: string, riskLevels?: string, model?: string): AsyncGenerator<string> {
    const prompt = PROMPTS.compliance.user(content, riskLevels);
    for await (const chunk of this.streamLLM(prompt, { model })) {
      yield chunk;
    }
  }
}
