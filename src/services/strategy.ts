import api from './api';

export interface Atom {
  id: string;
  name: string;
  type: 'hook' | 'channel' | 'content' | 'risk';
  description?: string;
  successRate?: number;
  usageCount: number;
  tags: string[];
  config?: any;
  scenarios?: string[];
  status: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ABTestConfig {
  id?: string;
  name: string;
  type: 'content' | 'channel' | 'time' | 'audience';
  branches: {
    id: string;
    name: string;
    weight: number;
    config: any;
  }[];
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate?: string;
  endDate?: string;
  metric: string;
}

export interface TaskSchedule {
  id: string;
  name: string;
  scenarioId?: string;
  strategyId?: string;
  triggerType: 'fixed' | 'periodic' | 'event';
  triggerConfig: any;
  targetSegment?: string;
  channels: string[];
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export const getAtoms = (params?: {
  type?: string;
  page?: number;
  limit?: number;
}) => api.get('/atoms', { params });

export const getAtom = (id: string) => api.get(`/atoms/${id}`);

export const createAtom = (data: Partial<Atom>) =>
  api.post('/atoms', data);

export const updateAtom = (id: string, data: Partial<Atom>) =>
  api.put(`/atoms/${id}`, data);

export const deleteAtom = (id: string) => api.delete(`/atoms/${id}`);

export const getABTests = (params?: any) => api.get('/abtests', { params });

export const getABTest = (id: string) => api.get(`/abtests/${id}`);

export const createABTest = (data: Partial<ABTestConfig>) =>
  api.post('/abtests', data);

export const updateABTest = (id: string, data: Partial<ABTestConfig>) =>
  api.put(`/abtests/${id}`, data);

export const startABTest = (id: string) => api.post(`/abtests/${id}/start`);

export const stopABTest = (id: string) => api.post(`/abtests/${id}/stop`);

export const getABTestResult = (id: string) => api.get(`/abtests/${id}/result`);

export const getSchedules = (params?: any) => api.get('/schedules', { params });

export const createSchedule = (data: Partial<TaskSchedule>) =>
  api.post('/schedules', data);

export const pauseSchedule = (id: string) => api.post(`/schedules/${id}/pause`);

export const resumeSchedule = (id: string) => api.post(`/schedules/${id}/resume`);
