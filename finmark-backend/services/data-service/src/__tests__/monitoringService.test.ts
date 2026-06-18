import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    modelCallLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { monitoringService } from '../services/monitoringService.js';
import { prisma } from '../config/database.js';

const mockCallLog = {
  id: 'call-001',
  modelName: 'gemini-2.5-flash',
  provider: 'gemini',
  promptTokens: 150,
  completionTokens: 300,
  totalTokens: 450,
  responseTime: 1200,
  success: true,
  errorMessage: null,
  agentType: 'insight',
  createdAt: new Date('2025-06-01T10:00:00Z'),
};

describe('MonitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logModelCall', () => {
    it('should log a successful model call', async () => {
      (prisma.modelCallLog.create as any).mockResolvedValue(mockCallLog);

      const result = await monitoringService.logModelCall({
        modelName: 'gemini-2.5-flash',
        provider: 'gemini',
        promptTokens: 150,
        completionTokens: 300,
        totalTokens: 450,
        responseTime: 1200,
        success: true,
        agentType: 'insight',
      });

      expect(prisma.modelCallLog.create).toHaveBeenCalledWith({
        data: {
          modelName: 'gemini-2.5-flash',
          provider: 'gemini',
          promptTokens: 150,
          completionTokens: 300,
          totalTokens: 450,
          responseTime: 1200,
          success: true,
          errorMessage: undefined,
          agentType: 'insight',
        },
      });
      expect(result).toEqual(mockCallLog);
    });

    it('should log a failed model call with error message', async () => {
      const failedLog = { ...mockCallLog, success: false, errorMessage: 'Rate limit exceeded' };
      (prisma.modelCallLog.create as any).mockResolvedValue(failedLog);

      const result = await monitoringService.logModelCall({
        modelName: 'gemini-2.5-flash',
        provider: 'gemini',
        promptTokens: 100,
        completionTokens: 0,
        totalTokens: 100,
        responseTime: 500,
        success: false,
        errorMessage: 'Rate limit exceeded',
        agentType: 'content',
      });

      expect(prisma.modelCallLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            success: false,
            errorMessage: 'Rate limit exceeded',
          }),
        })
      );
      expect(result.success).toBe(false);
    });

    it('should log without optional agentType', async () => {
      const logNoAgent = { ...mockCallLog, agentType: null };
      (prisma.modelCallLog.create as any).mockResolvedValue(logNoAgent);

      await monitoringService.logModelCall({
        modelName: 'deepseek-chat',
        provider: 'openai',
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150,
        responseTime: 800,
        success: true,
      });

      expect(prisma.modelCallLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agentType: undefined,
          errorMessage: undefined,
        }),
      });
    });
  });

  describe('getModelCallStats', () => {
    it('should return overall call statistics', async () => {
      (prisma.modelCallLog.count as any).mockResolvedValue(1000);
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([
        { modelName: 'gemini-2.5-flash', _count: { _all: 600 }, _avg: { responseTime: 1100 }, _sum: { totalTokens: 270000 } },
        { modelName: 'deepseek-chat', _count: { _all: 400 }, _avg: { responseTime: 900 }, _sum: { totalTokens: 180000 } },
      ]);
      (prisma.modelCallLog.aggregate as any).mockResolvedValue({
        _avg: { responseTime: 1020 },
        _sum: { totalTokens: 450000, promptTokens: 150000, completionTokens: 300000 },
      });

      const result = await monitoringService.getModelCallStats({});

      expect(result.totalCalls).toBe(1000);
      expect(result.byModel).toHaveLength(2);
      expect(result.byModel[0].modelName).toBe('gemini-2.5-flash');
      expect(result.byModel[0].count).toBe(600);
      expect(result.totalTokens).toBe(450000);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-06-01');
      const endDate = new Date('2025-06-15');
      (prisma.modelCallLog.count as any).mockResolvedValue(500);
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);
      (prisma.modelCallLog.aggregate as any).mockResolvedValue({
        _avg: { responseTime: 1000 },
        _sum: { totalTokens: 200000, promptTokens: 80000, completionTokens: 120000 },
      });

      await monitoringService.getModelCallStats({ startDate, endDate });

      expect(prisma.modelCallLog.count).toHaveBeenCalledWith({
        where: { createdAt: { gte: startDate, lte: endDate } },
      });
    });

    it('should filter by model name', async () => {
      (prisma.modelCallLog.count as any).mockResolvedValue(300);
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);
      (prisma.modelCallLog.aggregate as any).mockResolvedValue({
        _avg: { responseTime: 1100 },
        _sum: { totalTokens: 150000, promptTokens: 60000, completionTokens: 90000 },
      });

      await monitoringService.getModelCallStats({ modelName: 'gemini-2.5-flash' });

      expect(prisma.modelCallLog.count).toHaveBeenCalledWith({
        where: { modelName: 'gemini-2.5-flash' },
      });
    });

    it('should return empty stats when no calls exist', async () => {
      (prisma.modelCallLog.count as any).mockResolvedValue(0);
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);
      (prisma.modelCallLog.aggregate as any).mockResolvedValue({
        _avg: { responseTime: null },
        _sum: { totalTokens: null, promptTokens: null, completionTokens: null },
      });

      const result = await monitoringService.getModelCallStats({});

      expect(result.totalCalls).toBe(0);
      expect(result.byModel).toEqual([]);
      expect(result.totalTokens).toBe(0);
    });
  });

  describe('getResponseTimeStats', () => {
    it('should return response time percentiles', async () => {
      const sortedCalls = Array.from({ length: 100 }, (_, i) => ({
        responseTime: (i + 1) * 10,
      }));
      (prisma.modelCallLog.findMany as any).mockResolvedValue(sortedCalls);
      (prisma.modelCallLog.aggregate as any).mockResolvedValue({
        _avg: { responseTime: 505 },
        _min: { responseTime: 10 },
        _max: { responseTime: 1000 },
      });

      const result = await monitoringService.getResponseTimeStats({});

      expect(result.avg).toBe(505);
      expect(result.min).toBe(10);
      expect(result.max).toBe(1000);
      expect(result.p50).toBe(500);
      expect(result.p95).toBe(950);
      expect(result.p99).toBe(990);
    });

    it('should filter by model name', async () => {
      (prisma.modelCallLog.findMany as any).mockResolvedValue([
        { responseTime: 100 },
        { responseTime: 200 },
        { responseTime: 300 },
      ]);
      (prisma.modelCallLog.aggregate as any).mockResolvedValue({
        _avg: { responseTime: 200 },
        _min: { responseTime: 100 },
        _max: { responseTime: 300 },
      });

      const result = await monitoringService.getResponseTimeStats({ modelName: 'gemini-2.5-flash' });

      expect(prisma.modelCallLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ modelName: 'gemini-2.5-flash' }),
        })
      );
      expect(result.p50).toBe(200);
    });

    it('should handle empty results', async () => {
      (prisma.modelCallLog.findMany as any).mockResolvedValue([]);
      (prisma.modelCallLog.aggregate as any).mockResolvedValue({
        _avg: { responseTime: null },
        _min: { responseTime: null },
        _max: { responseTime: null },
      });

      const result = await monitoringService.getResponseTimeStats({});

      expect(result.avg).toBe(0);
      expect(result.p50).toBe(0);
      expect(result.p95).toBe(0);
      expect(result.p99).toBe(0);
    });
  });

  describe('getUsageStats', () => {
    it('should return token usage statistics by model', async () => {
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([
        {
          modelName: 'gemini-2.5-flash',
          _sum: { promptTokens: 150000, completionTokens: 300000, totalTokens: 450000 },
          _count: { _all: 600 },
        },
        {
          modelName: 'deepseek-chat',
          _sum: { promptTokens: 80000, completionTokens: 120000, totalTokens: 200000 },
          _count: { _all: 400 },
        },
      ]);

      const result = await monitoringService.getUsageStats({});

      expect(result.byModel).toHaveLength(2);
      expect(result.byModel[0]).toEqual({
        modelName: 'gemini-2.5-flash',
        promptTokens: 150000,
        completionTokens: 300000,
        totalTokens: 450000,
        callCount: 600,
      });
      expect(result.totalPromptTokens).toBe(230000);
      expect(result.totalCompletionTokens).toBe(420000);
      expect(result.totalTokens).toBe(650000);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-06-01');
      const endDate = new Date('2025-06-15');
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);

      await monitoringService.getUsageStats({ startDate, endDate });

      expect(prisma.modelCallLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        })
      );
    });

    it('should return zero totals when no data', async () => {
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);

      const result = await monitoringService.getUsageStats({});

      expect(result.byModel).toEqual([]);
      expect(result.totalTokens).toBe(0);
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', async () => {
      (prisma.modelCallLog.count as any)
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(50);
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([
        { errorMessage: 'Rate limit exceeded', _count: { _all: 30 } },
        { errorMessage: 'Invalid API key', _count: { _all: 10 } },
        { errorMessage: 'Timeout', _count: { _all: 10 } },
      ]);

      const result = await monitoringService.getErrorStats({});

      expect(result.totalCalls).toBe(1000);
      expect(result.errorCalls).toBe(50);
      expect(result.errorRate).toBe(5);
      expect(result.byError).toHaveLength(3);
      expect(result.byError[0]).toEqual({ error: 'Rate limit exceeded', count: 30 });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-06-01');
      const endDate = new Date('2025-06-15');
      (prisma.modelCallLog.count as any).mockResolvedValue(0);
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);

      await monitoringService.getErrorStats({ startDate, endDate });

      expect(prisma.modelCallLog.count).toHaveBeenCalledWith({
        where: { success: false, createdAt: { gte: startDate, lte: endDate } },
      });
    });

    it('should handle zero errors', async () => {
      (prisma.modelCallLog.count as any)
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(0);
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);

      const result = await monitoringService.getErrorStats({});

      expect(result.errorRate).toBe(0);
      expect(result.byError).toEqual([]);
    });
  });

  describe('getDailyStats', () => {
    it('should return daily aggregated stats', async () => {
      const mockDailyData = [
        {
          createdAt: new Date('2025-06-01T00:00:00Z'),
          _count: { _all: 150 },
          _avg: { responseTime: 1000 },
          _sum: { totalTokens: 67500, promptTokens: 22500, completionTokens: 45000 },
        },
        {
          createdAt: new Date('2025-06-02T00:00:00Z'),
          _count: { _all: 200 },
          _avg: { responseTime: 950 },
          _sum: { totalTokens: 90000, promptTokens: 30000, completionTokens: 60000 },
        },
      ];

      (prisma.modelCallLog.groupBy as any).mockResolvedValue(mockDailyData);

      const result = await monitoringService.getDailyStats({});

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2025-06-01',
        totalCalls: 150,
        avgResponseTime: 1000,
        totalTokens: 67500,
        promptTokens: 22500,
        completionTokens: 45000,
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-06-01');
      const endDate = new Date('2025-06-15');
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);

      await monitoringService.getDailyStats({ startDate, endDate });

      expect(prisma.modelCallLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        })
      );
    });

    it('should filter by model name', async () => {
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);

      await monitoringService.getDailyStats({ modelName: 'deepseek-chat' });

      expect(prisma.modelCallLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ modelName: 'deepseek-chat' }),
        })
      );
    });

    it('should return empty array when no data', async () => {
      (prisma.modelCallLog.groupBy as any).mockResolvedValue([]);

      const result = await monitoringService.getDailyStats({});

      expect(result).toEqual([]);
    });
  });
});
