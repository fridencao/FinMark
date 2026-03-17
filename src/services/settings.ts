import api from './api';

export interface ModelConfig {
  id: string;
  name: string;
  type: 'api' | 'local';
  apiUrl?: string;
  apiKey?: string;
  modelVersion?: string;
  temperature: number;
  maxTokens: number;
  status: 'enabled' | 'disabled';
  isDefault?: boolean;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'crm' | 'rights' | 'channel' | 'bigdata';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  lastSync?: string;
}

export const getModels = () => api.get('/settings/models');

export const getModel = (id: string) => api.get(`/settings/models/${id}`);

export const createModel = (data: Partial<ModelConfig>) =>
  api.post('/settings/models', data);

export const updateModel = (id: string, data: Partial<ModelConfig>) =>
  api.put(`/settings/models/${id}`, data);

export const deleteModel = (id: string) => api.delete(`/settings/models/${id}`);

export const testModel = (id: string) => api.post(`/settings/models/${id}/test`);

export const setDefaultModel = (id: string) =>
  api.post(`/settings/models/${id}/default`);

export const getGlobalConfig = () => api.get('/settings/global');

export const updateGlobalConfig = (data: any) =>
  api.put('/settings/global', data);

export const getIntegrations = () => api.get('/settings/integrations');

export const getIntegration = (type: string) =>
  api.get(`/settings/integrations/${type}`);

export const updateIntegration = (type: string, config: any) =>
  api.put(`/settings/integrations/${type}`, { config });

export const testIntegration = (type: string) =>
  api.post(`/settings/integrations/${type}/test`);

export const connectIntegration = (type: string) =>
  api.post(`/settings/integrations/${type}/connect`);

export const disconnectIntegration = (type: string) =>
  api.post(`/settings/integrations/${type}/disconnect`);