import api from './api';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  enabled: boolean;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  context?: any;
  result?: any;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push' | 'wechat' | 'call';
  content: string;
  variables: string[];
  category?: string;
  description?: string;
  isSystem: boolean;
  usageCount: number;
  status: 'active' | 'inactive' | 'archived';
}

export async function getWorkflows(status?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  return api.get(`/expert/workflows?${params}`);
}

export async function getWorkflow(id: string) {
  return api.get(`/expert/workflows/${id}`);
}

export async function createWorkflow(data: { name: string; description?: string; nodes: any[]; edges: any[] }) {
  return api.post('/expert/workflows', data);
}

export async function updateWorkflow(id: string, data: Partial<Workflow>) {
  return api.put(`/expert/workflows/${id}`, data);
}

export async function deleteWorkflow(id: string) {
  return api.delete(`/expert/workflows/${id}`);
}

export async function executeWorkflow(id: string) {
  return api.post(`/expert/workflows/${id}/execute`);
}

export async function getWorkflowExecutions(workflowId?: string) {
  const params = new URLSearchParams();
  if (workflowId) params.append('workflowId', workflowId);
  return api.get(`/expert/workflows/executions/history?${params}`);
}

export async function getTemplates(type?: string, category?: string) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (category) params.append('category', category);
  return api.get(`/expert/templates?${params}`);
}

export async function getTemplate(id: string) {
  return api.get(`/expert/templates/${id}`);
}

export async function createTemplate(data: { name: string; type: string; content: string; variables: string[]; category?: string; description?: string }) {
  return api.post('/expert/templates', data);
}

export async function updateTemplate(id: string, data: Partial<Template>) {
  return api.put(`/expert/templates/${id}`, data);
}

export async function deleteTemplate(id: string) {
  return api.delete(`/expert/templates/${id}`);
}

export async function renderTemplate(id: string, variables: Record<string, string>) {
  return api.post(`/expert/templates/${id}/render`, { variables });
}

export async function duplicateTemplate(id: string, newName: string) {
  return api.post(`/expert/templates/${id}/duplicate`, { newName });
}

export async function getBatchStrategies(status?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  return api.get(`/expert/batch?${params}`);
}

export async function createBatchStrategy(data: { name: string; description?: string; operations: any[]; targetIds: string[] }) {
  return api.post('/expert/batch', data);
}

export async function executeBatchStrategy(id: string) {
  return api.post(`/expert/batch/${id}/execute`);
}

export async function getBatchStatus(id: string) {
  return api.get(`/expert/batch/${id}`);
}

export async function cancelBatchStrategy(id: string) {
  return api.post(`/expert/batch/${id}/cancel`);
}
