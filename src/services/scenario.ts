import api from './api';

export interface Scenario {
  id: string;
  title: string;
  goal: string;
  category: string;
  icon?: string;
  color?: string;
  insightConfig?: {
    targetTags: string[];
    analysisLogic: string;
  };
  segmentConfig?: {
    criteria: string;
    maxCount: number;
  };
  contentConfig?: {
    style: string;
    channels: string[];
  };
  strategyConfig?: {
    path: string;
  };
  isCustom?: boolean;
  complianceScore?: number;
  riskLevel?: string;
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
  api.post('/scenarios/generate', { description });

export const executeScenario = (id: string, params?: any) =>
  api.post(`/scenarios/${id}/execute`, params);

export const getDefaultScenarios = () => api.get('/scenarios/defaults');

export const getScenarioCategories = () => api.get('/scenarios/categories');
