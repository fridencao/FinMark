import api from './api';

export interface MonitoringStats {
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  totalTokens: number;
  errorRate: number;
  callsChange: number;
  successRateChange: number;
  responseTimeChange: number;
  tokensChange: number;
}

export interface ModelStats {
  model: string;
  calls: number;
  successRate: number;
  avgResponseTime: number;
  totalTokens: number;
}

export interface DailyStats {
  date: string;
  calls: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  totalTokens: number;
}

export interface ErrorStats {
  errorType: string;
  count: number;
  percentage: number;
}

export interface ModelCallLog {
  id: string;
  model: string;
  agent: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseTime: number;
  status: 'success' | 'error';
  errorMessage?: string;
  createdAt: string;
}

export const logModelCall = (data: {
  model: string;
  agent: string;
  promptTokens: number;
  completionTokens: number;
  responseTime: number;
  status: 'success' | 'error';
  errorMessage?: string;
}) => api.post('/monitoring/calls', data);

export const getMonitoringStats = (params?: { timeRange?: string }) =>
  api.get('/monitoring/stats', { params });

export const getModelStats = (params?: { timeRange?: string }) =>
  api.get('/monitoring/models', { params });

export const getDailyStats = (params?: { timeRange?: string }) =>
  api.get('/monitoring/daily', { params });

export const getErrorStats = (params?: { timeRange?: string }) =>
  api.get('/monitoring/errors', { params });

export const getRecentCalls = (params?: {
  page?: number;
  pageSize?: number;
  model?: string;
  status?: string;
  timeRange?: string;
}) => api.get('/monitoring/calls', { params });
