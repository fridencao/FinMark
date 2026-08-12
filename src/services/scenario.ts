import api from './api';

export type ScenarioCategory =
  | 'acquisition'
  | 'growth'
  | 'mature'
  | 'declining'
  | 'recovery';

export type ScenarioIcon = 'Users' | 'Zap' | 'TrendingUp' | 'ShieldCheck' | 'Sparkles';
export type ScenarioColor = 'blue' | 'green' | 'orange' | 'red' | 'purple';

export interface InsightConfig {
  targetTags: string[];
  analysisLogic: string;
}
export interface SegmentConfig {
  criteria: string;
  maxCount: number;
}
export interface ContentConfig {
  style: string;
  channels: string[];
}
export interface StrategyConfig {
  path: string;
}

/** /scenarios/generate 在 LLM 通过校验时返回的结构(可直接落库) */
export interface GeneratedFourStageScenario {
  title: string;
  goal: string;
  category: ScenarioCategory;
  icon: ScenarioIcon;
  color: ScenarioColor;
  insightConfig: InsightConfig;
  segmentConfig: SegmentConfig;
  contentConfig: ContentConfig;
  strategyConfig: StrategyConfig;
}

/** /scenarios/generate 的完整响应数据形状 */
export type GenerateScenarioResponse =
  | { valid: true; scenario: GeneratedFourStageScenario }
  | { valid: false; fallback?: boolean; errors: string[] };

export interface Scenario {
  id: string;
  title: string;
  goal: string;
  category: string;
  icon?: string;
  color?: string;
  insightConfig?: InsightConfig;
  segmentConfig?: SegmentConfig;
  contentConfig?: ContentConfig;
  strategyConfig?: StrategyConfig;
  isCustom?: boolean;
  complianceScore?: number;
  riskLevel?: string;
  config?: any;
  createdAt: string;
  updatedAt: string;
}

export const getScenarios = (params?: {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) => api.get('/scenarios', { params });

export const getScenario = (id: string) => api.get(`/scenarios/${id}`);

export const createScenario = (data: Partial<Scenario>) =>
  api.post('/scenarios', data);

export const updateScenario = (id: string, data: Partial<Scenario>) =>
  api.put(`/scenarios/${id}`, data);

export const deleteScenario = (id: string) => api.delete(`/scenarios/${id}`);

export const generateScenarioByAI = (description: string) =>
  api.post<GenerateScenarioResponse>('/scenarios/generate', { description });

export const executeScenario = (id: string, params?: any) =>
  api.post(`/scenarios/${id}/execute`, params);

export const getDefaultScenarios = () => api.get('/scenarios/defaults');

export const getScenarioCategories = () => api.get('/scenarios/categories');
