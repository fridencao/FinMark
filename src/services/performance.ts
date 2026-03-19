import api from './api';

export interface MetricData {
  reach: number;
  reachRate: number;
  reachChange: number;
  response: number;
  responseRate: number;
  responseChange: number;
  conversion: number;
  conversionRate: number;
  conversionChange: number;
  roi: number;
  roiChange: number;
  cost: number;
}

export interface AlarmRule {
  id: string;
  name: string;
  type: 'metric' | 'task' | 'system';
  condition: {
    metric: string;
    operator: string;
    value: number;
    duration?: number;
  };
  notify: {
    methods: string[];
    users: string[];
  };
  status: 'enabled' | 'disabled';
  createdAt: string;
}

export const getDashboardMetrics = (params?: { timeRange?: string }) =>
  api.get('/performance/dashboard', { params });

export const getDashboardTrend = (params?: { timeRange?: string }) =>
  api.get('/performance/trend', { params });

export const getDashboardCharts = (params?: {
  startDate?: string;
  endDate?: string;
  chartType?: 'channel' | 'segment' | 'activity';
}) => api.get('/performance/charts', { params });

export const getActivityReports = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) => api.get('/performance/reports', { params });

export const getActivityReport = (id: string) => api.get(`/performance/reports/${id}`);

export const exportReport = (id: string, format: 'excel' | 'pdf') =>
  api.get(`/performance/reports/${id}/export`, {
    params: { format },
    responseType: 'blob'
  });

export const getAlarmRules = () => api.get('/performance/alarms');

export const getAlarmRule = (id: string) => api.get(`/performance/alarms/${id}`);

export const createAlarmRule = (data: Partial<AlarmRule>) =>
  api.post('/performance/alarms', data);

export const updateAlarmRule = (id: string, data: Partial<AlarmRule>) =>
  api.put(`/performance/alarms/${id}`, data);

export const deleteAlarmRule = (id: string) => api.delete(`/performance/alarms/${id}`);

export const toggleAlarmRule = (id: string, status: 'enabled' | 'disabled') =>
  api.patch(`/performance/alarms/${id}/status`, { status });

export const getAlarmHistory = (params?: {
  page?: number;
  pageSize?: number;
  ruleId?: string;
  startDate?: string;
  endDate?: string;
}) => api.get('/performance/alarms/history', { params });
