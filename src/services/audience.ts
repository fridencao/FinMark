import api from './api';

export async function buildAudienceQuery(conditions: any[]) {
  return api.post('/expert/audience/build', { conditions });
}

export async function executeAudienceQuery(conditions: any[]) {
  return api.post('/expert/audience/execute', { conditions });
}

export async function getAudiencePreview(conditions: any[], limit: number = 1000) {
  return api.post('/expert/audience/preview', { conditions, limit });
}

export async function saveAudienceSegment(name: string, conditions: any[], description?: string) {
  return api.post('/expert/audience/segments', { name, description, conditions });
}

export async function getAudienceSegments(status?: string) {
  const params = status ? `?status=${status}` : '';
  return api.get(`/expert/audience/segments${params}`);
}
