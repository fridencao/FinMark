import axios, { AxiosInstance } from 'axios';
import { benefitConfig } from '../config/benefit.js';

type BenefitStatus = 'connected' | 'disconnected' | 'error';

interface HealthCheckResult {
  status: BenefitStatus;
  reason?: string;
}

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance | null {
  if (!benefitConfig.enabled) {
    return null;
  }
  if (!client) {
    client = axios.create({
      baseURL: benefitConfig.baseUrl,
      timeout: benefitConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': benefitConfig.apiKey,
      },
    });
  }
  return client;
}

export async function healthCheck(): Promise<HealthCheckResult> {
  const c = getClient();
  if (!c) {
    return { status: 'disconnected', reason: 'Not configured' };
  }

  try {
    await c.get('/health');
    return { status: 'connected' };
  } catch (err: any) {
    return { status: 'error', reason: err.message };
  }
}

export async function listBenefits(): Promise<any[]> {
  const c = getClient();
  if (!c) {
    return [];
  }

  try {
    const response = await c.get('/benefits');
    return response.data.benefits ?? [];
  } catch (err) {
    console.error('[benefitService] listBenefits error:', err);
    return [];
  }
}

export async function getBenefit(benefitId: string): Promise<any | null> {
  const c = getClient();
  if (!c) {
    return null;
  }

  try {
    const response = await c.get(`/benefits/${benefitId}`);
    return response.data.benefit ?? null;
  } catch (err) {
    console.error('[benefitService] getBenefit error:', err);
    return null;
  }
}

export async function validateBenefit(benefitId: string, userId?: string): Promise<any | null> {
  const c = getClient();
  if (!c) {
    return null;
  }

  try {
    const payload: Record<string, string> = { benefitId };
    if (userId) {
      payload.userId = userId;
    }
    const response = await c.post('/benefits/validate', payload);
    return response.data ?? null;
  } catch (err) {
    console.error('[benefitService] validateBenefit error:', err);
    return null;
  }
}