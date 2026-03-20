import api from './api';

export interface Activity {
  id: string;
  name: string;
  status: string;
  reach: number;
  response: number;
  conversion: number;
  roi: number;
  createdAt: string;
  completedAt?: string;
}

export interface ActivityDetails {
  execution: any;
  metrics: {
    reach: number;
    reachRate: string;
    responseRate: string;
    conversionRate: string;
    roi: number;
  };
  timeline: { event: string; timestamp: string; type: string }[];
  customerBreakdown: {
    bySegment: { segment: string; count: number }[];
    byChannel: { channel: string; count: number }[];
    byRegion: { region: string; count: number }[];
  };
}

export async function getActivityDetails(activityId: string) {
  return api.get(`/performance/activities/${activityId}`);
}

export async function listActivities(options?: {
  scenarioId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.scenarioId) params.append('scenarioId', options.scenarioId);
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  return api.get(`/performance/activities?${params}`);
}
