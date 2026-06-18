import api from './api';

export interface AbTestBranch {
  id: string;
  name: string;
  traffic: number;
  conversionCount: number;
  sampleSize: number;
}

export interface AbTest {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'channel' | 'timing' | 'segment' | 'strategy';
  status: 'draft' | 'running' | 'completed' | 'paused';
  metric: string;
  branches: AbTestBranch[];
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  winnerBranchId?: string;
}

export interface AbTestResult {
  testId: string;
  branches: {
    id: string;
    name: string;
    sampleSize: number;
    conversionCount: number;
    conversionRate: number;
    confidence: number;
  }[];
  winnerBranchId?: string;
  isSignificant: boolean;
  pValue: number;
}

export const getAbTests = (params?: {
  status?: string;
  type?: string;
  search?: string;
}) => api.get('/ab-tests', { params });

export const getAbTest = (id: string) => api.get(`/ab-tests/${id}`);

export const createAbTest = (data: {
  name: string;
  description: string;
  type: string;
  metric: string;
  branches: { name: string; traffic: number }[];
}) => api.post('/ab-tests', data);

export const updateAbTest = (id: string, data: Partial<AbTest>) =>
  api.put(`/ab-tests/${id}`, data);

export const deleteAbTest = (id: string) => api.delete(`/ab-tests/${id}`);

export const startAbTest = (id: string) =>
  api.post(`/ab-tests/${id}/start`);

export const stopAbTest = (id: string) =>
  api.post(`/ab-tests/${id}/stop`);

export const recordConversion = (id: string, data: {
  branchId: string;
  count?: number;
}) => api.post(`/ab-tests/${id}/conversions`, data);

export const getAbTestResults = (id: string) =>
  api.get(`/ab-tests/${id}/results`);
