import api from './api';

export type TriggerType = 'cron' | 'once' | 'event';
export type ScheduleStatus = 'active' | 'paused' | 'completed';

export interface TaskSchedule {
  id: string;
  name: string;
  scenarioId?: string;
  triggerType: TriggerType;
  triggerConfig?: Record<string, unknown>;
  targetSegment?: string;
  channels: string[];
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  executions?: TaskScheduleExecution[];
}

export interface TaskScheduleExecution {
  id: string;
  scheduleId: string;
  status: string;
  triggerType: string;
  result?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getTaskSchedules = (params?: {
  status?: ScheduleStatus;
  page?: number;
  limit?: number;
}) => api.get('/task-schedules', { params });

export const getTaskSchedule = (id: string) =>
  api.get(`/task-schedules/${id}`);

export const createTaskSchedule = (data: {
  name: string;
  scenarioId?: string;
  triggerType: TriggerType;
  triggerConfig?: Record<string, unknown>;
  targetSegment?: string;
  channels: string[];
}) => api.post('/task-schedules', data);

export const updateTaskSchedule = (id: string, data: {
  name?: string;
  scenarioId?: string;
  triggerType?: TriggerType;
  triggerConfig?: Record<string, unknown>;
  targetSegment?: string;
  channels?: string[];
}) => api.put(`/task-schedules/${id}`, data);

export const deleteTaskSchedule = (id: string) =>
  api.delete(`/task-schedules/${id}`);

export const pauseTaskSchedule = (id: string) =>
  api.post(`/task-schedules/${id}/pause`);

export const resumeTaskSchedule = (id: string) =>
  api.post(`/task-schedules/${id}/resume`);

export const getScheduleHistory = (id: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => api.get(`/task-schedules/${id}/history`, { params });
