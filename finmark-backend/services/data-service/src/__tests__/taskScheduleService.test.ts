import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    taskSchedule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    taskScheduleExecution: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import * as taskScheduleService from '../services/taskScheduleService.js';
import { prisma } from '../config/database.js';

const mockSchedule = {
  id: 'schedule-001',
  name: 'Daily Campaign',
  scenarioId: 'scenario-001',
  triggerType: 'cron',
  triggerConfig: { expression: '0 9 * * *' },
  targetSegment: 'segment-001',
  channels: ['sms', 'wechat'],
  status: 'active' as const,
  lastRunAt: null,
  nextRunAt: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const mockExecution = {
  id: 'exec-001',
  scheduleId: 'schedule-001',
  status: 'completed',
  triggerType: 'cron',
  result: { sent: 100 },
  error: null,
  startedAt: new Date('2025-01-01T09:00:00Z'),
  completedAt: new Date('2025-01-01T09:01:00Z'),
};

describe('TaskScheduleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSchedule', () => {
    it('should create a new schedule', async () => {
      (prisma.taskSchedule.create as any).mockResolvedValue(mockSchedule);

      const result = await taskScheduleService.createSchedule({
        name: 'Daily Campaign',
        scenarioId: 'scenario-001',
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 * * *' },
        targetSegment: 'segment-001',
        channels: ['sms', 'wechat'],
      });

      expect(prisma.taskSchedule.create).toHaveBeenCalledWith({
        data: {
          name: 'Daily Campaign',
          scenarioId: 'scenario-001',
          triggerType: 'cron',
          triggerConfig: { expression: '0 9 * * *' },
          targetSegment: 'segment-001',
          channels: ['sms', 'wechat'],
          status: 'active',
        },
      });
      expect(result).toEqual(mockSchedule);
    });

    it('should create a schedule with minimal fields', async () => {
      const minimalSchedule = { ...mockSchedule, name: 'Minimal', triggerType: 'event', channels: [] };
      (prisma.taskSchedule.create as any).mockResolvedValue(minimalSchedule);

      const result = await taskScheduleService.createSchedule({
        name: 'Minimal',
        triggerType: 'event',
        channels: [],
      });

      expect(prisma.taskSchedule.create).toHaveBeenCalled();
      expect(result.name).toBe('Minimal');
    });

    it('should create a one-time schedule', async () => {
      const oneTimeSchedule = {
        ...mockSchedule,
        triggerType: 'once',
        triggerConfig: { runAt: '2025-06-01T10:00:00Z' },
      };
      (prisma.taskSchedule.create as any).mockResolvedValue(oneTimeSchedule);

      const result = await taskScheduleService.createSchedule({
        name: 'One-time Task',
        triggerType: 'once',
        triggerConfig: { runAt: '2025-06-01T10:00:00Z' },
        channels: ['sms'],
      });

      expect(result.triggerType).toBe('once');
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule config', async () => {
      const updated = { ...mockSchedule, name: 'Updated Campaign' };
      (prisma.taskSchedule.update as any).mockResolvedValue(updated);

      const result = await taskScheduleService.updateSchedule('schedule-001', {
        name: 'Updated Campaign',
      });

      expect(prisma.taskSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-001' },
        data: { name: 'Updated Campaign' },
      });
      expect(result.name).toBe('Updated Campaign');
    });

    it('should update trigger config', async () => {
      const updated = { ...mockSchedule, triggerConfig: { expression: '0 18 * * *' } };
      (prisma.taskSchedule.update as any).mockResolvedValue(updated);

      const result = await taskScheduleService.updateSchedule('schedule-001', {
        triggerConfig: { expression: '0 18 * * *' },
      });

      expect(result.triggerConfig).toEqual({ expression: '0 18 * * *' });
    });

    it('should update channels', async () => {
      const updated = { ...mockSchedule, channels: ['email', 'push'] };
      (prisma.taskSchedule.update as any).mockResolvedValue(updated);

      const result = await taskScheduleService.updateSchedule('schedule-001', {
        channels: ['email', 'push'],
      });

      expect(result.channels).toEqual(['email', 'push']);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule', async () => {
      (prisma.taskSchedule.delete as any).mockResolvedValue(mockSchedule);

      await taskScheduleService.deleteSchedule('schedule-001');

      expect(prisma.taskSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'schedule-001' },
      });
    });
  });

  describe('pauseSchedule', () => {
    it('should pause an active schedule', async () => {
      const paused = { ...mockSchedule, status: 'paused' };
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(mockSchedule);
      (prisma.taskSchedule.update as any).mockResolvedValue(paused);

      const result = await taskScheduleService.pauseSchedule('schedule-001');

      expect(prisma.taskSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-001' },
        data: { status: 'paused' },
      });
      expect(result.status).toBe('paused');
    });

    it('should not pause a completed schedule', async () => {
      const completedSchedule = { ...mockSchedule, status: 'completed' };
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(completedSchedule);

      await expect(
        taskScheduleService.pauseSchedule('schedule-001')
      ).rejects.toThrow('Cannot pause a completed schedule');
    });
  });

  describe('resumeSchedule', () => {
    it('should resume a paused schedule', async () => {
      const paused = { ...mockSchedule, status: 'paused' };
      const resumed = { ...mockSchedule, status: 'active' };
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(paused);
      (prisma.taskSchedule.update as any).mockResolvedValue(resumed);

      const result = await taskScheduleService.resumeSchedule('schedule-001');

      expect(prisma.taskSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-001' },
        data: { status: 'active' },
      });
      expect(result.status).toBe('active');
    });

    it('should not resume a non-paused schedule', async () => {
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(mockSchedule);

      await expect(
        taskScheduleService.resumeSchedule('schedule-001')
      ).rejects.toThrow('Schedule is not paused');
    });
  });

  describe('getActiveSchedules', () => {
    it('should return all active schedules', async () => {
      (prisma.taskSchedule.findMany as any).mockResolvedValue([mockSchedule]);

      const result = await taskScheduleService.getActiveSchedules();

      expect(prisma.taskSchedule.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockSchedule]);
    });

    it('should return empty array when no active schedules', async () => {
      (prisma.taskSchedule.findMany as any).mockResolvedValue([]);

      const result = await taskScheduleService.getActiveSchedules();

      expect(result).toEqual([]);
    });
  });

  describe('evaluateTriggers', () => {
    it('should evaluate cron triggers and return due schedules', async () => {
      const now = new Date();
      const scheduleDue = {
        ...mockSchedule,
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 * * *' },
        nextRunAt: new Date(now.getTime() - 1000),
      };
      (prisma.taskSchedule.findMany as any).mockResolvedValue([scheduleDue]);

      const result = await taskScheduleService.evaluateTriggers();

      expect(prisma.taskSchedule.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          nextRunAt: { lte: expect.any(Date) },
        },
        orderBy: { nextRunAt: 'asc' },
      });
      expect(result.length).toBe(1);
    });

    it('should not return schedules not yet due', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      (prisma.taskSchedule.findMany as any).mockResolvedValue([]);

      const result = await taskScheduleService.evaluateTriggers();

      expect(result).toEqual([]);
    });

    it('should include event-triggered schedules', async () => {
      const eventSchedule = {
        ...mockSchedule,
        triggerType: 'event',
        triggerConfig: { event: 'customer.signup' },
      };
      (prisma.taskSchedule.findMany as any).mockResolvedValue([eventSchedule]);

      const result = await taskScheduleService.evaluateTriggers();

      expect(result.length).toBe(1);
    });
  });

  describe('executeSchedule', () => {
    it('should execute a schedule and create execution record', async () => {
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(mockSchedule);
      (prisma.taskScheduleExecution.create as any).mockResolvedValue(mockExecution);
      (prisma.taskSchedule.update as any).mockResolvedValue({
        ...mockSchedule,
        lastRunAt: new Date(),
      });

      const result = await taskScheduleService.executeSchedule('schedule-001');

      expect(prisma.taskScheduleExecution.create).toHaveBeenCalledWith({
        data: {
          scheduleId: 'schedule-001',
          status: 'running',
          triggerType: 'cron',
        },
      });
      expect(prisma.taskSchedule.update).toHaveBeenCalled();
    });

    it('should record failure in execution history', async () => {
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(mockSchedule);
      const failedExecution = { ...mockExecution, status: 'failed', error: 'Connection timeout' };
      (prisma.taskScheduleExecution.create as any).mockResolvedValue(failedExecution);
      (prisma.taskSchedule.update as any).mockResolvedValue(mockSchedule);

      const result = await taskScheduleService.executeSchedule('schedule-001');

      expect(result).toBeDefined();
    });

    it('should throw error for non-existent schedule', async () => {
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(null);

      await expect(
        taskScheduleService.executeSchedule('nonexistent')
      ).rejects.toThrow('Schedule not found');
    });

    it('should not execute a paused schedule', async () => {
      const pausedSchedule = { ...mockSchedule, status: 'paused' };
      (prisma.taskSchedule.findUnique as any).mockResolvedValue(pausedSchedule);

      await expect(
        taskScheduleService.executeSchedule('schedule-001')
      ).rejects.toThrow('Schedule is not active');
    });
  });

  describe('getScheduleHistory', () => {
    it('should return execution history for a schedule', async () => {
      (prisma.taskScheduleExecution.findMany as any).mockResolvedValue([mockExecution]);
      (prisma.taskScheduleExecution.count as any).mockResolvedValue(1);

      const result = await taskScheduleService.getScheduleHistory('schedule-001');

      expect(prisma.taskScheduleExecution.findMany).toHaveBeenCalledWith({
        where: { scheduleId: 'schedule-001' },
        orderBy: { startedAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.data).toEqual([mockExecution]);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, pages: 1 });
    });

    it('should support pagination', async () => {
      (prisma.taskScheduleExecution.findMany as any).mockResolvedValue([]);
      (prisma.taskScheduleExecution.count as any).mockResolvedValue(50);

      const result = await taskScheduleService.getScheduleHistory('schedule-001', { page: 3, limit: 10 });

      expect(prisma.taskScheduleExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.total).toBe(50);
    });

    it('should filter by status', async () => {
      (prisma.taskScheduleExecution.findMany as any).mockResolvedValue([]);
      (prisma.taskScheduleExecution.count as any).mockResolvedValue(0);

      await taskScheduleService.getScheduleHistory('schedule-001', { status: 'failed' });

      expect(prisma.taskScheduleExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scheduleId: 'schedule-001', status: 'failed' },
        })
      );
    });
  });

  describe('Schedule lifecycle', () => {
    it('should transition active → paused → active', async () => {
      const paused = { ...mockSchedule, status: 'paused' };
      const resumed = { ...mockSchedule, status: 'active' };

      (prisma.taskSchedule.findUnique as any).mockResolvedValue(mockSchedule);
      (prisma.taskSchedule.update as any)
        .mockResolvedValueOnce(paused)
        .mockResolvedValueOnce(resumed);

      const afterPause = await taskScheduleService.pauseSchedule('schedule-001');
      expect(afterPause.status).toBe('paused');

      (prisma.taskSchedule.findUnique as any).mockResolvedValue(paused);
      const afterResume = await taskScheduleService.resumeSchedule('schedule-001');
      expect(afterResume.status).toBe('active');
    });
  });

  describe('Periodic tasks', () => {
    it('should handle daily schedules', async () => {
      const dailySchedule = {
        ...mockSchedule,
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 * * *' },
      };
      (prisma.taskSchedule.create as any).mockResolvedValue(dailySchedule);

      const result = await taskScheduleService.createSchedule({
        name: 'Daily Report',
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 * * *' },
        channels: ['email'],
      });

      expect(result.triggerType).toBe('cron');
    });

    it('should handle weekly schedules', async () => {
      const weeklySchedule = {
        ...mockSchedule,
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 * * 1' },
      };
      (prisma.taskSchedule.create as any).mockResolvedValue(weeklySchedule);

      const result = await taskScheduleService.createSchedule({
        name: 'Weekly Digest',
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 * * 1' },
        channels: ['email'],
      });

      expect(result.triggerConfig).toEqual({ expression: '0 9 * * 1' });
    });

    it('should handle monthly schedules', async () => {
      const monthlySchedule = {
        ...mockSchedule,
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 1 * *' },
      };
      (prisma.taskSchedule.create as any).mockResolvedValue(monthlySchedule);

      const result = await taskScheduleService.createSchedule({
        name: 'Monthly Summary',
        triggerType: 'cron',
        triggerConfig: { expression: '0 9 1 * *' },
        channels: ['email'],
      });

      expect(result.triggerConfig).toEqual({ expression: '0 9 1 * *' });
    });
  });

  describe('Event-triggered tasks', () => {
    it('should handle event-triggered schedules', async () => {
      const eventSchedule = {
        ...mockSchedule,
        triggerType: 'event',
        triggerConfig: { event: 'customer.churn_risk', threshold: 0.8 },
      };
      (prisma.taskSchedule.create as any).mockResolvedValue(eventSchedule);

      const result = await taskScheduleService.createSchedule({
        name: 'Churn Prevention',
        triggerType: 'event',
        triggerConfig: { event: 'customer.churn_risk', threshold: 0.8 },
        channels: ['sms', 'wechat'],
      });

      expect(result.triggerType).toBe('event');
    });
  });
});
