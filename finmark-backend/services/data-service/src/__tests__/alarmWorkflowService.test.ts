import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockFindUnique, mockUpdate, mockGroupBy, mockCount, mockFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockGroupBy: vi.fn(),
  mockCount: vi.fn(),
  mockFindMany: vi.fn().mockResolvedValue([]),
}));

vi.mock('../config/database.js', () => ({
  prisma: {
    alarmHistory: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      groupBy: mockGroupBy,
      count: mockCount,
    },
  },
}));

import * as alarmWorkflowService from '../services/alarmWorkflowService.js';
import { prisma } from '../config/database.js';

describe('alarmWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAlarm = {
    id: 'alarm-001',
    ruleId: 'rule-001',
    triggeredAt: new Date('2025-01-15T10:00:00Z'),
    value: 85.5,
    status: 'triggered',
    acknowledged: false,
    acknowledgedAt: null,
    processedAt: null,
    resolvedAt: null,
    comments: [],
    rule: { id: 'rule-001', name: 'High CPC', metric: 'cpc', level: 'warning' },
  };

  describe('acknowledgeAlarm', () => {
    it('should acknowledge an unacknowledged alarm', async () => {
      mockFindUnique.mockResolvedValueOnce({ ...mockAlarm });
      mockUpdate.mockResolvedValueOnce({
        ...mockAlarm,
        acknowledged: true,
        acknowledgedAt: new Date(),
        status: 'acknowledged',
      });

      const result = await alarmWorkflowService.acknowledgeAlarm('alarm-001');

      expect(result.acknowledged).toBe(true);
      expect(result.acknowledgedAt).toBeDefined();
      expect(result.status).toBe('acknowledged');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'alarm-001' },
        data: {
          acknowledged: true,
          acknowledgedAt: expect.any(Date),
          status: 'acknowledged',
        },
      });
    });

    it('should throw if alarm not found', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(
        alarmWorkflowService.acknowledgeAlarm('nonexistent')
      ).rejects.toThrow('Alarm not found');
    });

    it('should throw if alarm is already resolved', async () => {
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        status: 'resolved',
        resolvedAt: new Date(),
      });

      await expect(
        alarmWorkflowService.acknowledgeAlarm('alarm-001')
      ).rejects.toThrow('Cannot acknowledge a resolved alarm');
    });
  });

  describe('startProcessing', () => {
    it('should transition alarm from acknowledged to processing', async () => {
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        acknowledged: true,
        status: 'acknowledged',
      });
      mockUpdate.mockResolvedValueOnce({
        ...mockAlarm,
        status: 'processing',
        acknowledged: true,
        processedAt: new Date(),
      });

      const result = await alarmWorkflowService.startProcessing('alarm-001');

      expect(result.status).toBe('processing');
      expect(result.processedAt).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'alarm-001' },
        data: {
          status: 'processing',
          processedAt: expect.any(Date),
        },
      });
    });

    it('should throw if alarm is not acknowledged', async () => {
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        status: 'triggered',
      });

      await expect(
        alarmWorkflowService.startProcessing('alarm-001')
      ).rejects.toThrow('Alarm must be acknowledged before processing');
    });

    it('should throw if alarm not found', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(
        alarmWorkflowService.startProcessing('nonexistent')
      ).rejects.toThrow('Alarm not found');
    });
  });

  describe('resolveAlarm', () => {
    it('should resolve a processing alarm', async () => {
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        status: 'processing',
        acknowledged: true,
      });
      mockUpdate.mockResolvedValueOnce({
        ...mockAlarm,
        status: 'resolved',
        acknowledged: true,
        resolvedAt: new Date(),
      });

      const result = await alarmWorkflowService.resolveAlarm('alarm-001');

      expect(result.status).toBe('resolved');
      expect(result.resolvedAt).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'alarm-001' },
        data: {
          status: 'resolved',
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('should throw if alarm not found', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(
        alarmWorkflowService.resolveAlarm('nonexistent')
      ).rejects.toThrow('Alarm not found');
    });

    it('should throw if alarm is already resolved', async () => {
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        status: 'resolved',
      });

      await expect(
        alarmWorkflowService.resolveAlarm('alarm-001')
      ).rejects.toThrow('Alarm is already resolved');
    });
  });

  describe('addComment', () => {
    it('should add a comment to alarm history', async () => {
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        comments: [],
      });
      mockUpdate.mockResolvedValueOnce({
        ...mockAlarm,
        comments: [
          {
            id: expect.any(String),
            author: 'admin',
            content: 'Investigating the issue',
            createdAt: expect.any(String),
          },
        ],
      });

      const result = await alarmWorkflowService.addComment(
        'alarm-001',
        'admin',
        'Investigating the issue'
      );

      expect(result.comments).toHaveLength(1);
      expect((result.comments as any[])[0].author).toBe('admin');
      expect((result.comments as any[])[0].content).toBe('Investigating the issue');
    });

    it('should append comment to existing comments', async () => {
      const existingComments = [
        { id: 'c1', author: 'admin', content: 'First comment', createdAt: '2025-01-15T10:00:00Z' },
      ];
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        comments: existingComments,
      });
      mockUpdate.mockResolvedValueOnce({
        ...mockAlarm,
        comments: [
          ...existingComments,
          { id: expect.any(String), author: 'ops', content: 'Second comment', createdAt: expect.any(String) },
        ],
      });

      const result = await alarmWorkflowService.addComment(
        'alarm-001',
        'ops',
        'Second comment'
      );

      expect(result.comments).toHaveLength(2);
    });

    it('should throw if alarm not found', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(
        alarmWorkflowService.addComment('nonexistent', 'admin', 'test')
      ).rejects.toThrow('Alarm not found');
    });
  });

  describe('getAlarmDetails', () => {
    it('should return alarm with full history and rule', async () => {
      mockFindUnique.mockResolvedValueOnce({
        ...mockAlarm,
        rule: mockAlarm.rule,
        comments: [{ id: 'c1', author: 'admin', content: 'test', createdAt: new Date().toISOString() }],
      });

      const result = await alarmWorkflowService.getAlarmDetails('alarm-001');

      expect(result).toBeDefined();
      expect(result?.id).toBe('alarm-001');
      expect(result?.rule).toBeDefined();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'alarm-001' },
        include: {
          rule: true,
        },
      });
    });

    it('should return null for non-existent alarm', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      const result = await alarmWorkflowService.getAlarmDetails('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAlarmStats', () => {
    it('should return alarm statistics', async () => {
      mockCount.mockResolvedValueOnce(10);
      mockGroupBy.mockResolvedValueOnce([
        { status: 'triggered', _count: 5 },
        { status: 'acknowledged', _count: 3 },
        { status: 'processing', _count: 1 },
        { status: 'resolved', _count: 1 },
      ]);

      const result = await alarmWorkflowService.getAlarmStats();

      expect(result.total).toBe(10);
      expect(result.byStatus).toHaveLength(4);
      expect(result.byStatus[0]).toEqual({ status: 'triggered', count: 5 });
    });

    it('should filter stats by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockCount.mockResolvedValueOnce(5);
      mockGroupBy.mockResolvedValueOnce([
        { status: 'triggered', _count: 3 },
        { status: 'resolved', _count: 2 },
      ]);

      const result = await alarmWorkflowService.getAlarmStats(startDate, endDate);

      expect(result.total).toBe(5);
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          triggeredAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    });
  });

  describe('getAlarmHistory', () => {
    it('should return alarm history with filters', async () => {
      const mockHistory = [
        { ...mockAlarm, id: 'alarm-001' },
        { ...mockAlarm, id: 'alarm-002', status: 'resolved' },
      ];

      mockFindMany.mockResolvedValueOnce(mockHistory);

      const result = await alarmWorkflowService.getAlarmHistory({
        status: 'triggered',
      });

      expect(result).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      const mockHistory = [{ ...mockAlarm }];

      mockFindMany.mockResolvedValueOnce(mockHistory);

      const result = await alarmWorkflowService.getAlarmHistory({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no history matches', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const result = await alarmWorkflowService.getAlarmHistory({
        status: 'nonexistent',
      });

      expect(result).toHaveLength(0);
    });
  });
});
