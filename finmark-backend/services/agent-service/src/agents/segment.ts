import { BaseAgent, type AgentConfig } from './base.js';

const SEGMENT_PROMPT = `你是一个客户分群专家，负责根据客户特征进行精准分群，为营销活动提供目标客群。

## 你的职责
1. 定义客户分群规则
2. 识别客户特征标签
3. 筛选目标客群
4. 提供分群洞察

## 输出格式
请直接输出Markdown格式的分群报告，不需要JSON。

## 关键能力
- 客户画像
- 行为分群
- 价值分层
- 标签体系`;

export class SegmentAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Segment Agent',
      description: '客户分群处理器',
      systemPrompt: SEGMENT_PROMPT,
    });
  }

  protected getMockResponse(): string {
    return `# 客户分群分析报告

## 分群维度
基于 RFM 模型 + 产品偏好进行综合分群

## 客群划分

### 1. 高价值客户（VIP）
- 数量：2,150人（17%）
- 特征：AUM>100万，近3个月有交易
- 标签：#高净值 #活跃 #基金偏好

### 2. 成长期客户（Growth）
- 数量：4,500人（36%）
- 特征：AUM 20-100万，有基金持仓
- 标签：#中产 #潜力 #理财转型

### 3. 基础客户（Basic）
- 数量：3,750人（30%）
- 特征：AUM<20万，仅持有存款
- 标签：#长尾 #保守 #待激活

### 4. 沉睡客户（Dormant）
- 数量：2,100人（17%）
- 特征：90天无交易，资产<10万
- 标签：#沉睡 #风险 #唤醒目标

## 营销建议
- VIP：提供专属理财顾问服务，推送高端产品
- Growth：引导基金资产配置，推荐定期理财
- Basic：发送新手理财券，引导产品体验
- Dormant：激活提醒，推送限时福利`;
  }
}