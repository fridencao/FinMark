import api from './api';

export interface Benefit {
  id: string;
  name: string;
  description?: string;
}

export interface BenefitHealth {
  status: 'connected' | 'disconnected' | 'error';
  reason?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function getBenefits(): Promise<Benefit[]> {
  const response = await api.get('/benefits') as ApiResponse<Benefit[]>;
  return response.data ?? [];
}

export async function getBenefit(benefitId: string): Promise<Benefit | null> {
  const response = await api.get(`/benefits/${benefitId}`) as ApiResponse<Benefit | null>;
  return response.data ?? null;
}

export async function validateBenefit(benefitId: string, userId?: string): Promise<any> {
  const payload: Record<string, string> = { benefitId };
  if (userId) {
    payload.userId = userId;
  }
  const response = await api.post('/benefits/validate', payload) as ApiResponse<any>;
  return response.data ?? null;
}

export async function checkBenefitHealth(): Promise<BenefitHealth> {
  try {
    const response = await api.get('/benefits/health') as ApiResponse<BenefitHealth>;
    return response.data ?? { status: 'disconnected' };
  } catch {
    return { status: 'disconnected' };
  }
}