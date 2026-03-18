import axios from 'axios';

const LLM_GATEWAY_URL = process.env.LLM_GATEWAY_URL || 'http://localhost:3002';

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }

  protected async callLLM(messages: any[]): Promise<string> {
    try {
      const response = await axios.post(`${LLM_GATEWAY_URL}/v1/completions`, {
        model: 'gemini/gemini-1.5-pro',
        messages,
        temperature: 0.7,
      }, {
        timeout: 60000,
      });
      return response.data.content;
    } catch (error) {
      console.error('LLM call failed:', error);
      return this.getMockResponse();
    }
  }

  protected buildMessages(userMessage: string): { role: string; content: string }[] {
    return [
      { role: 'system', content: this.config.systemPrompt },
      { role: 'user', content: userMessage },
    ];
  }

  protected abstract getMockResponse(): string;

  async execute(input: string, context?: Record<string, any>): Promise<string> {
    const prompt = context ? `${input}\n\n上下文: ${JSON.stringify(context)}` : input;
    const messages = this.buildMessages(prompt);
    return this.callLLM(messages);
  }

  async *stream(input: string, context?: Record<string, any>): AsyncGenerator<string> {
    const prompt = context ? `${input}\n\n上下文: ${JSON.stringify(context)}` : input;
    const mockResponse = this.getMockResponse();
    
    const words = mockResponse.split('');
    for (const word of words) {
      yield word;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  getName(): string {
    return this.config.name;
  }

  getDescription(): string {
    return this.config.description;
  }
}