import { BaseAgent, type AgentConfig } from './base.js';

const MASTER_PROMPT = `你是一个金融营销总监，负责协调多个AI智能体完成营销任务。

## 你的职责
1. 理解用户的营销目标
2. 将目标分解为可执行的子任务
3. 协调各智能体工作
4. 汇总结果并输出完整方案

## 输出格式
请直接输出Markdown格式的方案，不需要JSON。

## 关键能力
- 目标拆解
- 资源分配
- 风险评估
- 效果预测`;

export class MasterAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Master Agent',
      description: '营销任务编排器',
      systemPrompt: MASTER_PROMPT,
    });
  }

  async orchestrate(goal: string, context?: Record<string, any>): Promise<string> {
    const prompt = `营销目标: ${goal}
    
请分解这个目标并输出执行方案。`;
    return this.execute(prompt, context);
  }

  protected getMockResponse(): string {
    return `# 营销执行方案

## 目标拆解
1. 核心目标：季末 AUM 增长
2. 目标客群：中高端理财客户
3. 预计周期：2 周

## 资源需求
- 短信预算：¥5,000
- 人力：3 名客户经理
- 系统：营销自动化平台

## 执行步骤
1. 洞察分析 → 2. 客群筛选 → 3. 内容生成 → 4. 合规审查 → 5. 策略制定 → 6. 效果评估`;
  }
}