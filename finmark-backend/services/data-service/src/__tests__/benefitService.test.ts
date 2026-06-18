import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
    })),
  },
}));

vi.mock('../config/benefit.js', () => ({
  benefitConfig: {
    enabled: true,
    baseUrl: 'http://mock-benefit.test/api',
    apiKey: 'test-key',
    timeout: 5000,
  },
}));

import { healthCheck, listBenefits, getBenefit, validateBenefit } from '../services/benefitService.js';

describe('benefitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return connected when health check succeeds', async () => {
      mockGet.mockResolvedValueOnce({ data: { status: 'ok' } });

      const result = await healthCheck();

      expect(result).toEqual({ status: 'connected' });
      expect(mockGet).toHaveBeenCalledWith('/health');
    });

    it('should return error when health check fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await healthCheck();

      expect(result).toEqual({ status: 'error', reason: 'Connection refused' });
    });
  });

  describe('listBenefits', () => {
    it('should return list of benefits', async () => {
      const mockBenefits = [
        { id: 'b1', name: '健康险', description: '健康医疗保险' },
        { id: 'b2', name: '意外险', description: '意外伤害保险' },
      ];
      mockGet.mockResolvedValueOnce({ data: { benefits: mockBenefits } });

      const result = await listBenefits();

      expect(result).toEqual(mockBenefits);
      expect(mockGet).toHaveBeenCalledWith('/benefits');
    });

    it('should return empty array when benefits not found', async () => {
      mockGet.mockResolvedValueOnce({ data: { benefits: [] } });

      const result = await listBenefits();

      expect(result).toEqual([]);
    });

    it('should return empty array and log error on failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await listBenefits();

      expect(result).toEqual([]);
    });
  });

  describe('getBenefit', () => {
    it('should return benefit when found', async () => {
      const mockBenefit = { id: 'b1', name: '健康险', description: '健康医疗保险' };
      mockGet.mockResolvedValueOnce({ data: { benefit: mockBenefit } });

      const result = await getBenefit('b1');

      expect(result).toEqual(mockBenefit);
      expect(mockGet).toHaveBeenCalledWith('/benefits/b1');
    });

    it('should return null when benefit not found', async () => {
      mockGet.mockResolvedValueOnce({ data: { benefit: null } });

      const result = await getBenefit('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null and log error on failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await getBenefit('b1');

      expect(result).toBeNull();
    });
  });

  describe('validateBenefit', () => {
    it('should validate benefit successfully', async () => {
      const mockResult = { valid: true, benefitId: 'b1', userId: 'u1' };
      mockPost.mockResolvedValueOnce({ data: mockResult });

      const result = await validateBenefit('b1', 'u1');

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith('/benefits/validate', { benefitId: 'b1', userId: 'u1' });
    });

    it('should validate benefit without userId', async () => {
      const mockResult = { valid: true, benefitId: 'b1' };
      mockPost.mockResolvedValueOnce({ data: mockResult });

      const result = await validateBenefit('b1');

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith('/benefits/validate', { benefitId: 'b1' });
    });

    it('should return null and log error on failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      const result = await validateBenefit('b1');

      expect(result).toBeNull();
    });
  });
});

describe('benefitService disabled config', () => {
  it('should return disconnected when not enabled', async () => {
    vi.resetModules();
    vi.doMock('../config/benefit.js', () => ({
      benefitConfig: {
        enabled: false,
        baseUrl: '',
        apiKey: '',
        timeout: 5000,
      },
    }));

    const { healthCheck: healthCheckDisabled } = await import('../services/benefitService.js');

    const result = await healthCheckDisabled();
    expect(result).toEqual({ status: 'disconnected', reason: 'Not configured' });
  });

  it('should return empty array for listBenefits when disabled', async () => {
    vi.resetModules();
    vi.doMock('../config/benefit.js', () => ({
      benefitConfig: {
        enabled: false,
        baseUrl: '',
        apiKey: '',
        timeout: 5000,
      },
    }));

    const { listBenefits: listBenefitsDisabled } = await import('../services/benefitService.js');

    const result = await listBenefitsDisabled();
    expect(result).toEqual([]);
  });

  it('should return null for getBenefit when disabled', async () => {
    vi.resetModules();
    vi.doMock('../config/benefit.js', () => ({
      benefitConfig: {
        enabled: false,
        baseUrl: '',
        apiKey: '',
        timeout: 5000,
      },
    }));

    const { getBenefit: getBenefitDisabled } = await import('../services/benefitService.js');

    const result = await getBenefitDisabled('b1');
    expect(result).toBeNull();
  });

  it('should return null for validateBenefit when disabled', async () => {
    vi.resetModules();
    vi.doMock('../config/benefit.js', () => ({
      benefitConfig: {
        enabled: false,
        baseUrl: '',
        apiKey: '',
        timeout: 5000,
      },
    }));

    const { validateBenefit: validateBenefitDisabled } = await import('../services/benefitService.js');

    const result = await validateBenefitDisabled('b1');
    expect(result).toBeNull();
  });
});