import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const MODEL_NAME = "gemini-3-flash-preview";

// Mock responses for development when API key is not set
const mockResponses: Record<string, string> = {
  insight: "## 客户洞察分析\n\n- **当前状态**: 目标客群资产规模稳定\n- **流失风险**: 低 (15%)\n- **营销时机**: 佳 - 季末是关键窗口期",
  segment: "## 客群筛选条件\n\n```json\n{\n  \"aum\": { \"gte\": 500000 },\n  \"age\": { \"between\": [30, 55] },\n  \"riskLevel\": [\"R3\", \"R4\", \"R5\"],\n  \"productCount\": { \"gte\": 2 }\n}\n```\n\n预计覆盖客户数：8,500 人",
  content: "## 营销文案建议\n\n**短信标题**: 尊敬的客户，您的专属理财方案已生成\n\n**正文**:\n尊敬的{customerName}，基于您的风险偏好，为您精选以下产品...\n\n**话术要点**:\n- 强调专业性和个性化\n- 避免承诺收益\n- 突出风险提示",
  compliance: "## 合规审查报告\n\n### ⚠️ 需修改项\n1. \"稳健收益\" → 建议改为\"历史业绩稳健\"\n2. \"最佳选择\" → 建议改为\"优质选择之一\"\n\n### ✅ 合规项\n- 已包含风险提示语\n- 未使用绝对化用语",
  strategy: "## 触达策略\n\n1. **第一波** (Day 1): 短信触达\n2. **第二波** (Day 3): 未响应客户 → APP 推送\n3. **第三波** (Day 5): 高价值未响应 → 客户经理电话\n\n预计触达率：65%",
  analyst: "## 效果预估分析\n\n| 指标 | 预估值 |\n|------|--------|\n| 触达客户 | 8,500 |\n| 预计响应率 | 12% |\n| 预计转化 | 3% |\n| 预计 AUM 增长 | ¥15M |",
  master: "## 营销执行方案\n\n### 目标拆解\n1. 核心目标：季末 AUM 增长\n2. 目标客群：中高端理财客户\n3. 预计周期：2 周\n\n### 资源需求\n- 短信预算：¥5,000\n- 人力：3 名客户经理\n- 系统：营销自动化平台",
};

export interface AgentResponse {
  content: string;
  data?: any;
}

export async function* streamAgent(agentType: string, prompt: string, context?: any, lang: string = 'zh') {
  // If no API key, return mock response
  if (!ai) {
    const mockText = mockResponses[agentType as keyof typeof mockResponses] || "Mock response";
    yield mockText;
    return;
  }

  const langInstruction = lang === 'en' ? "Please respond in English." : "请使用简体中文回复。";

  const systemInstructions = {
    insight: "你是一个金融客户洞察专家。严格按照下面的章节结构输出 Markdown 报告，每个章节只输出模板中列出的内容，不要添加或重复内容。\n\n## 客户洞察分析报告\n- **目标客群特征**: [分析核心特征]\n- **潜在流失风险**: [分析流失原因和概率]\n- **最佳营销时机**: [指出关键时间窗口]\n- **推荐客户标签**: [建议标签]\n\n## 深度见解与风险预警\n- **深度见解**: [数据驱动的独特发现]\n- **风险预警**: [需要关注的风险]\n- **行动建议**: [具体的下一步]\n\n硬性要求：\n1. \"推荐客户标签\"只出现在\"客户洞察分析报告\"章节，不得在\"深度见解与风险预警\"章节中出现\n2. 两个章节的内容必须完全不同，不允许任何交叉重复\n3. 严格按照模板格式输出，不要额外增加或合并章节",
    segment: "你是一个精准客群专家。请简洁地提供客群筛选逻辑。",
    content: "你是一个金融文案专家。请简洁地生成营销文案。",
    compliance: "你是一个金融合规审查专家。请像审计员一样审查文案，高亮潜在的违禁词（如保本保息、绝对收益），并给出修改建议。",
    strategy: "你是一个营销策略专家。请简洁地制定触达路径。",
    analyst: "你是一个营销效果评估专家。请简洁地分析转化漏斗和 ROI。",
    master: "你是一个金融营销总监。请快速分解目标并提供核心执行方案。请直接输出 Markdown 内容，不要包含 JSON 格式。",
    architect: "你是一个金融营销架构师。请快速设计营销蓝图。输出 JSON：title, goal, insightLogic, segmentCriteria, contentStyle, strategyPath。"
  };

  const responseStream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: {
      parts: [{ text: `[系统指令]: ${systemInstructions[agentType as keyof typeof systemInstructions]}\n\n[语言要求]: ${langInstruction}\n\n[上下文]: ${JSON.stringify(context || {})}\n\n[用户请求]: ${prompt}` }]
    },
    config: {
      temperature: 0.4,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    }
  });

  for await (const chunk of responseStream) {
    yield chunk.text;
  }
}

export async function chatWithCustomer(message: string, history: {role: string, content: string}[], context: any, lang: string = 'zh'): Promise<string> {
  if (!ai) {
    return "（客户）好的，我再考虑一下。";
  }

  const langInstruction = lang === 'en' ? "Please respond in English." : "请使用简体中文回复。";

  const systemInstruction = "你现在扮演一个银行的真实客户。请根据上下文中的客群画像和营销方案，模拟客户的真实反应。你的回答应该简短、口语化，像在微信聊天一样。如果理财经理的话术生硬或不合规，你要表现出反感或疑虑；如果话术切中痛点，你可以表现出兴趣。请直接输出你的回复。";

  const historyText = history.map(h => `${h.role === 'user' ? '理财经理' : '客户'}: ${h.content}`).join('\n');
  const prompt = `[对话历史]:\n${historyText}\n\n[理财经理最新回复]: ${message}\n\n请给出你的回复：`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [{ text: `[系统指令]: ${systemInstruction}\n\n[语言要求]: ${langInstruction}\n\n[上下文 (营销方案)]: ${JSON.stringify(context || {})}\n\n${prompt}` }]
    },
    config: {
      temperature: 0.7,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    }
  });

  return response.text || "（客户没有回复）";
}

export async function callAgent(agentType: string, prompt: string, context?: any, lang: string = 'zh'): Promise<AgentResponse> {
  // If no API key, return mock response
  if (!ai) {
    const mockText = mockResponses[agentType as keyof typeof mockResponses] || "Mock response";
    return { content: mockText };
  }

  const langInstruction = lang === 'en' ? "Please respond in English." : "请使用简体中文回复。";

  const systemInstructions = {
    insight: "你是一个金融客户洞察专家。输出一份完整的客户洞察分析报告（Markdown 格式），包含客户洞察分析和深度见解与风险预警两个章节，每个章节必须包含不同的独特内容，不要重复相同的信息。核心能力：识别关键时刻、预测流失、挖掘潜力。",
    segment: "你是一个精准客群专家。请简洁地提供客群筛选逻辑。核心能力：标签筛选、人群扩展、KYC/KYP 匹配。",
    content: "你是一个金融文案专家。请简洁地生成营销文案。核心能力：多渠道文案、情感适配。",
    compliance: "你是一个金融合规审查专家。请像审计员一样审查文案，高亮潜在的违禁词（如保本保息、绝对收益），并给出修改建议。核心能力：禁语库校验、风险提示语补全。",
    strategy: "你是一个营销策略专家。请简洁地制定触达路径。核心能力：NBA 推荐、多渠道编排、频次控制。",
    analyst: "你是一个营销效果评估专家。请简洁地分析转化漏斗和 ROI。核心能力：实时监控、归因分析、复盘报告。",
    master: "你是一个金融营销总监。请快速分解目标并提供核心执行方案。核心能力：目标分解、资源预估、风险预警。",
    architect: "你是一个金融营销架构师。请快速设计营销蓝图。输出 JSON：title, goal, insightLogic, segmentCriteria, contentStyle, strategyPath。"
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [{ text: `[系统指令]: ${systemInstructions[agentType as keyof typeof systemInstructions]}\n\n[语言要求]: ${langInstruction}\n\n[上下文]: ${JSON.stringify(context || {})}\n\n[用户请求]: ${prompt}` }]
    },
    config: {
      temperature: 0.4,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: "智能体的文字回复或分析报告" },
          data: { type: Type.OBJECT, description: "结构化数据" }
        },
        required: ["content"]
      }
    }
  });

  try {
    const parsed = JSON.parse(response.text || "{}");
    return {
      content: parsed.content || "未生成具体内容",
      data: parsed.data
    };
  } catch (e) {
    return { content: response.text || "解析失败" };
  }
}
