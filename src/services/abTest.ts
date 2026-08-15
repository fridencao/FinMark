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

export type ConversionSource =
  | 'sms' | 'wechat' | 'app' | 'email' | 'phone'
  | 'bigdata' | 'crm' | 'webhook' | 'manual';

export interface IngestEventInput {
  eventId?: string;
  branchId: string;
  source: ConversionSource;
  customerId?: string;
  channel?: string;
  value?: number;
}

export interface IngestEventsResult {
  total: number;
  accepted: number;
  deduped: number;
  rejected: Array<{ index: number; eventId?: string; reason: string }>;
  conversionsAdded: Record<string, number>;
}

/**
 * 批量投递转化事件(模拟渠道/大数据 firehose 回推)。
 * 用于演示 PRD 7.2 "渠道反馈→评估" 闭环;后台每天 5min 跑一次也可。
 * eventId 存在则幂等,重复投递只算一次。
 */
export const ingestAbTestEvents = (id: string, events: IngestEventInput[]) =>
  api.post<{ success: true; data: IngestEventsResult }>(`/ab-tests/${id}/events`, { events });

export const getAbTestResults = (id: string) =>
  api.get(`/ab-tests/${id}/results`);
