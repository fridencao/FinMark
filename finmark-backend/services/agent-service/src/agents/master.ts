import { BaseAgent, AgentResult } from './base.js';
import { PROMPTS } from '../prompts/index.js';
import { InsightAgent } from './insight.js';
import { SegmentAgent } from './segment.js';
import { ContentAgent } from './content.js';
import { ComplianceAgent } from './compliance.js';
import { StrategyAgent } from './strategy.js';
import { AnalystAgent } from './analyst.js';

export interface OrchestrationContext {
  goal: string;
  budget?: number;
  channels?: string[];
  lang?: 'zh' | 'en';
  model?: string;
  prompts?: Record<string, string>;
}

export class MasterAgent extends BaseAgent {
  private insight = new InsightAgent();
  private segment = new SegmentAgent();
  private content = new ContentAgent();
  private compliance = new ComplianceAgent();
  private strategy = new StrategyAgent();
  private analyst = new AnalystAgent();

  constructor() {
    super({
      name: 'Master Agent',
      description: '营销总监 - 智能体编排器',
      systemPrompt: PROMPTS.master.system,
      temperature: 0.5,
    });
  }

  setLanguage(lang: 'zh' | 'en') {
    this.lang = lang;
    this.insight.setLanguage(lang);
    this.segment.setLanguage(lang);
    this.content.setLanguage(lang);
    this.compliance.setLanguage(lang);
    this.strategy.setLanguage(lang);
    this.analyst.setLanguage(lang);
  }

  private applyPrompts(prompts?: Record<string, string>) {
    if (!prompts) return;
    if (prompts.insight) this.insight.setSystemPrompt(prompts.insight);
    if (prompts.segment) this.segment.setSystemPrompt(prompts.segment);
    if (prompts.content) this.content.setSystemPrompt(prompts.content);
    if (prompts.compliance) this.compliance.setSystemPrompt(prompts.compliance);
    if (prompts.strategy) this.strategy.setSystemPrompt(prompts.strategy);
    if (prompts.analyst) this.analyst.setSystemPrompt(prompts.analyst);
  }

  async orchestrate(context: OrchestrationContext): Promise<{
    master: AgentResult;
    insight?: AgentResult;
    segment?: AgentResult;
    content?: AgentResult;
    compliance?: AgentResult;
    strategy?: AgentResult;
    analyst?: AgentResult;
  }> {
    this.setLanguage(context.lang || 'zh');
    this.applyPrompts(context.prompts);

    try {
      const insightResult = await this.insight.analyze(context.goal, undefined, context.model);
      const segmentResult = await this.segment.generate(insightResult.content, context.goal, context.model);
      const contentResult = await this.content.generate(
        segmentResult.content,
        context.goal,
        context.channels || ['短信', '企微', 'APP'],
        context.model
      );
      const complianceResult = await this.compliance.review(contentResult.content, undefined, context.model);
      const strategyResult = await this.strategy.plan(
        complianceResult.content,
        context.budget || 10000,
        context.channels || ['短信', '企微', 'APP', '外呼'],
        context.model
      );
      const analystResult = await this.analyst.evaluate(strategyResult.content, undefined, context.model);

      const summary = await this.callLLM(
        `请汇总以下各智能体的输出，生成一份完整的营销执行方案。\n\n` +
        `【洞察】:\n${insightResult.content}\n\n` +
        `【客群】:\n${segmentResult.content}\n\n` +
        `【内容】:\n${contentResult.content}\n\n` +
        `【合规】:\n${complianceResult.content}\n\n` +
        `【策略】:\n${strategyResult.content}\n\n` +
        `【评估】:\n${analystResult.content}`
      );

      return {
        master: { content: summary.content, usage: summary.usage },
        insight: insightResult,
        segment: segmentResult,
        content: contentResult,
        compliance: complianceResult,
        strategy: strategyResult,
        analyst: analystResult,
      };
    } catch (err: unknown) {
      console.error('[Master Agent] Orchestration failed:', err);
      return {
        master: { content: '', error: err instanceof Error ? err.message : String(err) },
      };
    }
  }

  async* streamOrchestrate(context: OrchestrationContext): AsyncGenerator<{
    agent: string;
    chunk: string;
    done: boolean;
  }> {
    this.setLanguage(context.lang || 'zh');
    this.applyPrompts(context.prompts);

    try {
      yield { agent: 'insight', chunk: '开始洞察分析...\n', done: false };
      let insightContent = '';
      for await (const chunk of this.insight.streamAnalyze(context.goal, undefined, context.model)) {
        insightContent += chunk;
        yield { agent: 'insight', chunk, done: false };
      }
      yield { agent: 'insight', chunk: '\n\n', done: true };

      yield { agent: 'segment', chunk: '开始客群筛选...\n', done: false };
      let segmentContent = '';
      for await (const chunk of this.segment.streamGenerate(insightContent, context.goal, context.model)) {
        segmentContent += chunk;
        yield { agent: 'segment', chunk, done: false };
      }
      yield { agent: 'segment', chunk: '\n\n', done: true };

      yield { agent: 'content', chunk: '开始生成文案...\n', done: false };
      let contentResult = '';
      for await (const chunk of this.content.streamGenerate(
        segmentContent,
        context.goal,
        context.channels || ['短信', '企微', 'APP'],
        context.model
      )) {
        contentResult += chunk;
        yield { agent: 'content', chunk, done: false };
      }
      yield { agent: 'content', chunk: '\n\n', done: true };

      yield { agent: 'compliance', chunk: '开始合规审查...\n', done: false };
      let complianceResult = '';
      for await (const chunk of this.compliance.streamReview(contentResult, undefined, context.model)) {
        complianceResult += chunk;
        yield { agent: 'compliance', chunk, done: false };
      }
      yield { agent: 'compliance', chunk: '\n\n', done: true };

      yield { agent: 'strategy', chunk: '开始制定策略...\n', done: false };
      let strategyResult = '';
      for await (const chunk of this.strategy.streamPlan(
        complianceResult,
        context.budget || 10000,
        context.channels || ['短信', '企微', 'APP', '外呼'],
        context.model
      )) {
        strategyResult += chunk;
        yield { agent: 'strategy', chunk, done: false };
      }
      yield { agent: 'strategy', chunk: '\n\n', done: true };

      yield { agent: 'analyst', chunk: '开始效果评估...\n', done: false };
      for await (const chunk of this.analyst.streamEvaluate(strategyResult, undefined, context.model)) {
        yield { agent: 'analyst', chunk, done: false };
      }
      yield { agent: 'analyst', chunk: '', done: true };

      yield { agent: 'master', chunk: '✅ 方案生成完成', done: true };
    } catch (err: unknown) {
      yield { agent: 'error', chunk: err instanceof Error ? err.message : String(err), done: true };
    }
  }
}
