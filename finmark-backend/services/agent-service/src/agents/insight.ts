import { BaseAgent, type AgentConfig } from './base.js';

const INSIGHT_PROMPT = `你是一个金融数据洞察专家，负责分析客户行为数据和营销数据，发现有价值的业务洞察。

## 你的职责
1. 分析客户交易行为
2. 发现客户偏好模式
3. 识别业务机会
4. 提供数据驱动的建议

## 输出格式
请直接输出Markdown格式的分析报告，不需要JSON。

## 关键能力
- 数据分析
- 趋势识别
- 异常检测
- 洞察提炼`;

export class InsightAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Insight Agent',
      description: '数据洞察分析器',
      systemPrompt: INSIGHT_PROMPT,
    });
  }

  protected getMockResponse(): string {
    return `# 客户洞察分析报告

## 数据概览
- 分析周期：过去30天
- 客群规模：12,500名活跃客户
- 交易笔数：45,230笔

## 关键发现

### 1. 交易行为模式
- 高频客户（>10次/月）：占12%，主要偏好基金产品
- 中频客户（3-10次/月）：占35%，倾向于稳健型理财
- 低频客户（<3次/月）：占53%，需要激活

### 2. 产品偏好洞察
- 基金产品：偏好率 42%，30岁以下客户为主
- 理财产品：偏好率 38%，40岁以上客户为主
- 保险产品：偏好率 15%，高净值客户为主

### 3. 机会识别
- 沉睡客户唤醒：建议针对 90天未交易客户发送专属理财方案
- 交叉销售：基金客户中 67% 未配置保险产品
- 资产升级：可挖掘客户中 23% 符合私行准入标准`;
  }
}