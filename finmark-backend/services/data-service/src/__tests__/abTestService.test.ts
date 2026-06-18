import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    abTest: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import * as abTestService from '../services/abTestService.js';
import { prisma } from '../config/database.js';

describe('abTestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTest', () => {
    it('should create a test with multiple branches', async () => {
      const input = {
        name: 'Homepage CTA Test',
        type: 'conversion',
        description: 'Test different CTA buttons',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 0, conversions: 0 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 0, conversions: 0 },
        ],
        metric: 'click_rate',
      };

      (prisma.abTest.create as any).mockResolvedValueOnce({
        id: 'test-001',
        ...input,
        status: 'draft',
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await abTestService.createTest(input);

      expect(result.status).toBe('draft');
      expect(result.branches).toHaveLength(2);
      expect(prisma.abTest.create).toHaveBeenCalledWith({
        data: {
          name: 'Homepage CTA Test',
          type: 'conversion',
          description: 'Test different CTA buttons',
          branches: input.branches,
          metric: 'click_rate',
        },
      });
    });

    it('should create a test with three branches', async () => {
      const input = {
        name: 'Email Subject Lines',
        type: 'engagement',
        branches: [
          { id: 'A', name: 'Original', weight: 34, impressions: 0, conversions: 0 },
          { id: 'B', name: 'Question', weight: 33, impressions: 0, conversions: 0 },
          { id: 'C', name: 'Urgency', weight: 33, impressions: 0, conversions: 0 },
        ],
        metric: 'open_rate',
      };

      (prisma.abTest.create as any).mockResolvedValueOnce({
        id: 'test-002',
        ...input,
        status: 'draft',
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await abTestService.createTest(input);

      expect(result.branches).toHaveLength(3);
    });
  });

  describe('getTestById', () => {
    it('should return a test by id', async () => {
      const mockTest = {
        id: 'test-001',
        name: 'Test',
        type: 'conversion',
        branches: [{ id: 'A', name: 'Control', weight: 50, impressions: 0, conversions: 0 }],
        metric: 'click_rate',
        status: 'draft',
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(mockTest);

      const result = await abTestService.getTestById('test-001');
      expect(result).toEqual(mockTest);
    });

    it('should return null for non-existent test', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce(null);

      const result = await abTestService.getTestById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listTests', () => {
    it('should list all tests', async () => {
      const tests = [
        { id: 'test-001', name: 'Test 1', status: 'draft' },
        { id: 'test-002', name: 'Test 2', status: 'running' },
      ];
      (prisma.abTest.findMany as any).mockResolvedValueOnce(tests);
      (prisma.abTest.count as any).mockResolvedValueOnce(2);

      const result = await abTestService.listTests();

      expect(result.data).toEqual(tests);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      (prisma.abTest.findMany as any).mockResolvedValueOnce([]);
      (prisma.abTest.count as any).mockResolvedValueOnce(0);

      await abTestService.listTests({ status: 'running' });

      expect(prisma.abTest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'running' }),
        })
      );
    });
  });

  describe('startTest', () => {
    it('should start a draft test', async () => {
      const draftTest = {
        id: 'test-001',
        name: 'Test',
        status: 'draft',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 0, conversions: 0 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 0, conversions: 0 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(draftTest);
      (prisma.abTest.update as any).mockResolvedValueOnce({
        ...draftTest,
        status: 'running',
        startDate: new Date(),
      });

      const result = await abTestService.startTest('test-001');

      expect(result.status).toBe('running');
      expect(result.startDate).toBeDefined();
    });

    it('should throw if test is not in draft status', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce({
        id: 'test-001',
        status: 'running',
      });

      await expect(abTestService.startTest('test-001')).rejects.toThrow(
        'Test must be in draft status to start'
      );
    });

    it('should throw if test not found', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce(null);

      await expect(abTestService.startTest('nonexistent')).rejects.toThrow('Test not found');
    });
  });

  describe('stopTest', () => {
    it('should stop a running test', async () => {
      const runningTest = {
        id: 'test-001',
        status: 'running',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 1000, conversions: 50 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 1000, conversions: 80 },
        ],
        metric: 'conversion_rate',
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(runningTest);
      (prisma.abTest.update as any).mockResolvedValueOnce({
        ...runningTest,
        status: 'completed',
        endDate: new Date(),
      });

      const result = await abTestService.stopTest('test-001');

      expect(result.status).toBe('completed');
      expect(result.endDate).toBeDefined();
    });

    it('should throw if test is not running', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce({
        id: 'test-001',
        status: 'draft',
      });

      await expect(abTestService.stopTest('test-001')).rejects.toThrow(
        'Test must be running to stop'
      );
    });
  });

  describe('recordConversion', () => {
    it('should record a conversion for a running test', async () => {
      const runningTest = {
        id: 'test-001',
        status: 'running',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 100, conversions: 5 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 100, conversions: 3 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(runningTest);
      (prisma.abTest.update as any).mockResolvedValueOnce({
        ...runningTest,
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 100, conversions: 5 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 100, conversions: 4 },
        ],
      });

      const result = await abTestService.recordConversion('test-001', 'B');

      const branches = result.branches as unknown as abTestService.Branch[];
      expect(branches[1].conversions).toBe(4);
    });

    it('should throw if test is not running', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce({
        id: 'test-001',
        status: 'draft',
      });

      await expect(abTestService.recordConversion('test-001', 'A')).rejects.toThrow(
        'Test must be running to record conversions'
      );
    });

    it('should throw if branch does not exist', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce({
        id: 'test-001',
        status: 'running',
        branches: [{ id: 'A', name: 'Control', weight: 50, impressions: 0, conversions: 0 }],
      });

      await expect(abTestService.recordConversion('test-001', 'Z')).rejects.toThrow(
        'Branch Z not found'
      );
    });
  });

  describe('allocateTraffic', () => {
    it('should allocate traffic randomly to branches', async () => {
      const test = {
        id: 'test-001',
        status: 'running',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 0, conversions: 0 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 0, conversions: 0 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(test);
      (prisma.abTest.update as any).mockResolvedValueOnce({
        ...test,
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 1, conversions: 0 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 0, conversions: 0 },
        ],
      });

      const result = await abTestService.allocateTraffic('test-001', 'random');

      expect(result.branch).toBeDefined();
      expect(['A', 'B']).toContain(result.branch);
    });

    it('should allocate traffic by percentage', async () => {
      const test = {
        id: 'test-001',
        status: 'running',
        branches: [
          { id: 'A', name: 'Control', weight: 70, impressions: 0, conversions: 0 },
          { id: 'B', name: 'Variant', weight: 30, impressions: 0, conversions: 0 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(test);
      (prisma.abTest.update as any).mockResolvedValueOnce({
        ...test,
        branches: [
          { id: 'A', name: 'Control', weight: 70, impressions: 1, conversions: 0 },
          { id: 'B', name: 'Variant', weight: 30, impressions: 0, conversions: 0 },
        ],
      });

      const result = await abTestService.allocateTraffic('test-001', 'percentage');

      expect(result.branch).toBeDefined();
    });

    it('should throw if test is not running', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce({
        id: 'test-001',
        status: 'draft',
      });

      await expect(abTestService.allocateTraffic('test-001', 'random')).rejects.toThrow(
        'Test must be running'
      );
    });
  });

  describe('getResults', () => {
    it('should return test results with statistics', async () => {
      const test = {
        id: 'test-001',
        name: 'CTA Test',
        status: 'completed',
        metric: 'conversion_rate',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 1000, conversions: 50 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 1000, conversions: 80 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(test);

      const result = await abTestService.getResults('test-001');

      expect(result.branches).toHaveLength(2);
      expect(result.branches[0].conversionRate).toBe(0.05);
      expect(result.branches[1].conversionRate).toBe(0.08);
    });

    it('should calculate statistical significance', async () => {
      const test = {
        id: 'test-001',
        name: 'CTA Test',
        status: 'completed',
        metric: 'conversion_rate',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 5000, conversions: 250 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 5000, conversions: 350 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(test);

      const result = await abTestService.getResults('test-001');

      expect(result.winner).toBeDefined();
      expect(result.isSignificant).toBeDefined();
    });

    it('should handle test with zero impressions', async () => {
      const test = {
        id: 'test-001',
        name: 'New Test',
        status: 'running',
        metric: 'click_rate',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 0, conversions: 0 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 0, conversions: 0 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(test);

      const result = await abTestService.getResults('test-001');

      expect(result.branches[0].conversionRate).toBe(0);
      expect(result.branches[1].conversionRate).toBe(0);
      expect(result.isSignificant).toBe(false);
    });
  });

  describe('selectWinner', () => {
    it('should select the branch with highest conversion rate', async () => {
      const test = {
        id: 'test-001',
        status: 'completed',
        metric: 'conversion_rate',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 1000, conversions: 50 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 1000, conversions: 80 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(test);

      const result = await abTestService.selectWinner('test-001');

      expect(result.winnerId).toBe('B');
      expect(result.winnerName).toBe('Variant');
    });

    it('should return null winner when conversion rates are equal', async () => {
      const test = {
        id: 'test-001',
        status: 'completed',
        metric: 'conversion_rate',
        branches: [
          { id: 'A', name: 'Control', weight: 50, impressions: 1000, conversions: 50 },
          { id: 'B', name: 'Variant', weight: 50, impressions: 1000, conversions: 50 },
        ],
      };

      (prisma.abTest.findUnique as any).mockResolvedValueOnce(test);

      const result = await abTestService.selectWinner('test-001');

      expect(result.winnerId).toBeNull();
    });

    it('should throw if test not found', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce(null);

      await expect(abTestService.selectWinner('nonexistent')).rejects.toThrow('Test not found');
    });
  });

  describe('deleteTest', () => {
    it('should delete a draft test', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce({
        id: 'test-001',
        status: 'draft',
      });
      (prisma.abTest.delete as any).mockResolvedValueOnce({});

      await abTestService.deleteTest('test-001');

      expect(prisma.abTest.delete).toHaveBeenCalledWith({ where: { id: 'test-001' } });
    });

    it('should throw if test is running', async () => {
      (prisma.abTest.findUnique as any).mockResolvedValueOnce({
        id: 'test-001',
        status: 'running',
      });

      await expect(abTestService.deleteTest('test-001')).rejects.toThrow(
        'Cannot delete a running test'
      );
    });
  });
});
