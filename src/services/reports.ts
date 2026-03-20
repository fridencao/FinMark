import api from './api';

export interface Report {
  id: string;
  name: string;
  type: 'summary' | 'scenario' | 'channel' | 'customer';
  format: 'pdf' | 'excel';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  fileId?: string;
  config: any;
  generatedAt?: string;
  createdAt: string;
}

export async function getReports(type?: string, status?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  return api.get(`/reports?${params}`);
}

export async function getReport(id: string) {
  return api.get(`/reports/${id}`);
}

export async function generateReport(data: {
  name: string;
  type: string;
  format: string;
  dateRange: { start: string; end: string };
  filters?: any;
}) {
  return api.post('/reports/generate', data);
}

export async function downloadReport(id: string) {
  return api.get(`/reports/${id}/download`, { responseType: 'blob' });
}

export async function deleteReport(id: string) {
  return api.delete(`/reports/${id}`);
}
