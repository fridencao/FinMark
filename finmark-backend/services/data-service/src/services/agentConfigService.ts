import { prisma } from '../config/database.js';

export const DEFAULT_AGENT_TYPES = ['insight', 'segment', 'content', 'compliance', 'strategy', 'analyst'];

export const DEFAULT_NAMES: Record<string, string> = {
  insight: '洞察智能体',
  segment: '客群智能体',
  content: '内容智能体',
  compliance: '合规智能体',
  strategy: '策略智能体',
  analyst: '评估智能体',
};

// Mirrors agent-service/src/prompts/index.ts system prompts exactly
export const DEFAULT_PROMPTS: Record<string, string> = {
  insight: `你是一个金融客户洞察专家。严格按照下面的章节结构输出 Markdown 报告，每个章节只输出模板中列出的内容，不要添加或重复内容。

## 客户洞察分析报告
- **目标客群特征**: [分析核心特征]
- **潜在流失风险**: [分析流失原因和概率]
- **最佳营销时机**: [指出关键时间窗口]
- **推荐客户标签**: [建议标签]

## 深度见解与风险预警
- **深度见解**: [数据驱动的独特发现]
- **风险预警**: [需要关注的风险]
- **行动建议**: [具体的下一步]

硬性要求：
1. "推荐客户标签"只出现在"客户洞察分析报告"章节，不得在"深度见解与风险预警"章节中出现
2. 两个章节的内容必须完全不同，不允许任何交叉重复
3. 严格按照模板格式输出，不要额外增加或合并章节`,
  segment: `你是一个精准客群专家。请根据洞察结果，生成：
1. 客户筛选条件（标签、AUM、年龄、风险等级等）
2. 预计覆盖客户数量
3. 客群画像描述

输出格式：Markdown + 结构化 JSON。
重要：如果客户规模超过 10 万，请提醒设置上限。`,
  content: `你是一个金融文案专家。请根据客群画像和营销目标，生成：
1. 默认 3 组不同风格的营销文案
2. 每组文案适配的渠道（短信/企微/APP）
3. 文案变量（客户姓名、产品名称、权益信息等）

输出格式：Markdown + 结构化 JSON。
注意：自动适配不同渠道的内容长度限制，避免违禁词。`,
  compliance: `你是一个金融合规审查专家。请审查文案：
1. 检查违禁词（保本保息、绝对收益等）
2. 校验风险等级匹配
3. 审核话术合规性
4. 补充必要风险提示语

像审计员一样严格，高亮违禁词并给出修改建议。
输出格式：Markdown + 结构化 JSON。`,
  strategy: `你是一个营销策略专家。请制定触达方案：
1. 多渠道触达路径（优先级排序）
2. 触达时间节点
3. 预算分配建议
4. 预期触达率和 ROI

支持定时/周期/事件任务，支持 A/B 测试版本生成。
输出格式：Markdown + 结构化 JSON。`,
  analyst: `你是一个营销效果评估专家。请分析：
1. 核心指标（触达率、响应率、转化率、ROI）
2. 异常检测（指标偏离告警）
3. 优化建议

支持实时监控、历史对比、归因分析。
输出格式：Markdown + 结构化 JSON。`,
};

export async function getAllConfigs() {
  const configs = await prisma.agentConfig.findMany();
  // Ensure all 6 agent types exist (seed missing ones)
  const existingTypes = new Set(configs.map((c) => c.agentType));
  const missing = DEFAULT_AGENT_TYPES.filter((t) => !existingTypes.has(t));
  if (missing.length > 0) {
    await prisma.agentConfig.createMany({
      data: missing.map((type) => ({
        agentType: type,
        name: DEFAULT_NAMES[type],
        prompt: DEFAULT_PROMPTS[type] || '',
      })),
    });
    return prisma.agentConfig.findMany();
  }
  return configs;
}

export async function getConfigByType(agentType: string) {
  let config = await prisma.agentConfig.findUnique({ where: { agentType } });
  if (!config && DEFAULT_AGENT_TYPES.includes(agentType)) {
    config = await prisma.agentConfig.create({
      data: {
        agentType,
        name: DEFAULT_NAMES[agentType],
        prompt: DEFAULT_PROMPTS[agentType] || '',
      },
    });
  }
  return config;
}

export async function updateConfig(agentType: string, data: {
  name?: string;
  prompt?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
}) {
  // Ensure the config exists first (lazy seed)
  await getConfigByType(agentType);
  return prisma.agentConfig.update({
    where: { agentType },
    data,
  });
}

export async function toggleConfig(agentType: string) {
  const config = await getConfigByType(agentType);
  if (!config) throw new Error(`Unknown agent type: ${agentType}`);
  return prisma.agentConfig.update({
    where: { agentType },
    data: { enabled: !config.enabled },
  });
}
