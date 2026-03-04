import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const MODEL_NAME = "gemini-3-flash-preview";

export interface AgentResponse {
  content: string;
  data?: any;
}

export async function* streamAgent(agentType: string, prompt: string, context?: any, lang: string = 'zh') {
  const langInstruction = lang === 'en' ? "Please respond in English." : "请使用简体中文回复。";
  
  const systemInstructions = {
    insight: "你是一个金融客户洞察专家。请简洁地提供深度见解和风险预警。",
    segment: "你是一个精准客群专家。请简洁地提供客群筛选逻辑。",
    content: "你是一个金融文案专家。请简洁地生成营销文案。",
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

export async function callAgent(agentType: string, prompt: string, context?: any, lang: string = 'zh'): Promise<AgentResponse> {
  const langInstruction = lang === 'en' ? "Please respond in English." : "请使用简体中文回复。";
  
  const systemInstructions = {
    insight: "你是一个金融客户洞察专家。请简洁地提供深度见解和风险预警。核心能力：识别关键时刻、预测流失、挖掘潜力。",
    segment: "你是一个精准客群专家。请简洁地提供客群筛选逻辑。核心能力：标签筛选、人群扩展、KYC/KYP 匹配。",
    content: "你是一个金融文案专家。请简洁地生成营销文案。核心能力：多渠道文案、合规检查、情感适配。",
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
