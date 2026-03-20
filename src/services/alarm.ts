import api from './api';

export interface AlarmRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  level: 'warning' | 'critical';
  channels: string[];
  enabled: boolean;
  createdAt: string;
}

export interface AlarmHistory {
  id: string;
  ruleId: string;
  rule: AlarmRule;
  triggeredAt: string;
  value: number;
  status: 'triggered' | 'resolved' | 'acknowledged';
  acknowledged: boolean;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export async function getAlarmRules() {
  return api.get('/alarms/rules');
}

export async function getAlarmRule(id: string) {
  return api.get(`/alarms/rules/${id}`);
}

export async function createAlarmRule(data: Partial<AlarmRule>) {
  return api.post('/alarms/rules', data);
}

export async function updateAlarmRule(id: string, data: Partial<AlarmRule>) {
  return api.put(`/alarms/rules/${id}`, data);
}

export async function deleteAlarmRule(id: string) {
  return api.delete(`/alarms/rules/${id}`);
}

export async function toggleAlarmRule(id: string, enabled: boolean) {
  return api.post(`/alarms/rules/${id}/toggle`, { enabled });
}

export async function getAlarmHistory(ruleId?: string, status?: string) {
  const params = new URLSearchParams();
  if (ruleId) params.append('ruleId', ruleId);
  if (status) params.append('status', status);
  return api.get(`/alarms/history?${params}`);
}

export async function acknowledgeAlarm(id: string) {
  return api.post(`/alarms/history/${id}/acknowledge`);
}

export async function resolveAlarm(id: string) {
  return api.post(`/alarms/history/${id}/resolve`);
}

export async function triggerAlarmEvaluation() {
  return api.post('/alarms/evaluate');
}
