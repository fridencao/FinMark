import api from './api';

export interface InsightRequest {
  targetGoal: string;
  customerTags?: string[];
}

export interface SegmentRequest {
  insightId: string;
  maxCount?: number;
}

export interface ContentRequest {
  segmentId: string;
  channels: string[];
  tone?: string;
}

export interface ComplianceRequest {
  contentId: string;
  customerRiskLevels?: Record<string, number>;
}

export interface StrategyRequest {
  complianceId: string;
  budget: number;
  channels: string[];
}

export interface EvaluationRequest {
  strategyId: string;
  startDate: string;
  endDate: string;
}

export const callInsightAgent = (data: InsightRequest) =>
  api.post('/agents/insight', data);

export const callSegmentAgent = (data: SegmentRequest) =>
  api.post('/agents/segment', data);

export const callContentAgent = (data: ContentRequest) =>
  api.post('/agents/content', data);

export const callComplianceAgent = (data: ComplianceRequest) =>
  api.post('/agents/compliance', data);

export const callStrategyAgent = (data: StrategyRequest) =>
  api.post('/agents/strategy', data);

export const callEvaluationAgent = (data: EvaluationRequest) =>
  api.post('/agents/evaluation', data);

export const runMasterAgent = (goal: string, context?: any) =>
  api.post('/agents/master', { goal, context });

export const streamAgent = (agentType: string, goal: string, context?: any) =>
  api.post(`/agents/${agentType}/stream`, { goal, context }, {
    responseType: 'stream'
  });

export const chatWithCustomer = (message: string, history: any[], context?: any) =>
  api.post('/agents/copilot/chat', { message, history, context });

export const getAgentStatus = () => api.get('/agents/status');