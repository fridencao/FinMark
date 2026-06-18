import api from './api';

export interface ForbiddenWord {
  id: string;
  word: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  description: string;
  pattern: string;
  action: 'block' | 'warn' | 'log';
  status: 'enabled' | 'disabled';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceCheckResult {
  id: string;
  content: string;
  passed: boolean;
  violations: {
    ruleId: string;
    ruleName: string;
    category: string;
    severity: string;
    matchedContent: string;
    position: { start: number; end: number };
    suggestion: string;
  }[];
  checkedAt: string;
}

export interface ComplianceLog {
  id: string;
  content: string;
  passed: boolean;
  violationCount: number;
  checkedBy: string;
  checkedAt: string;
  source: string;
}

export const getForbiddenWords = (params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  severity?: string;
  search?: string;
  status?: string;
}) => api.get('/compliance/forbidden-words', { params });

export const getForbiddenWord = (id: string) =>
  api.get(`/compliance/forbidden-words/${id}`);

export const createForbiddenWord = (data: Partial<ForbiddenWord>) =>
  api.post('/compliance/forbidden-words', data);

export const updateForbiddenWord = (id: string, data: Partial<ForbiddenWord>) =>
  api.put(`/compliance/forbidden-words/${id}`, data);

export const deleteForbiddenWord = (id: string) =>
  api.delete(`/compliance/forbidden-words/${id}`);

export const toggleForbiddenWord = (id: string, status: 'active' | 'inactive') =>
  api.patch(`/compliance/forbidden-words/${id}/status`, { status });

export const getComplianceRules = (params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  search?: string;
}) => api.get('/compliance/rules', { params });

export const getComplianceRule = (id: string) =>
  api.get(`/compliance/rules/${id}`);

export const createComplianceRule = (data: Partial<ComplianceRule>) =>
  api.post('/compliance/rules', data);

export const updateComplianceRule = (id: string, data: Partial<ComplianceRule>) =>
  api.put(`/compliance/rules/${id}`, data);

export const deleteComplianceRule = (id: string) =>
  api.delete(`/compliance/rules/${id}`);

export const toggleComplianceRule = (id: string, status: 'enabled' | 'disabled') =>
  api.patch(`/compliance/rules/${id}/status`, { status });

export const checkCompliance = (data: { content: string; source?: string }) =>
  api.post('/compliance/check', data);

export const getComplianceLogs = (params?: {
  page?: number;
  pageSize?: number;
  passed?: boolean;
  startDate?: string;
  endDate?: string;
  source?: string;
}) => api.get('/compliance/logs', { params });
