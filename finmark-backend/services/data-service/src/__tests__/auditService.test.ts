import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { auditService } from '../services/auditService.js';
import { prisma } from '../config/database.js';

const mockAuditLog = {
  id: 'audit-001',
  userId: 'user-001',
  action: 'CREATE',
  resource: 'scenario',
  details: { scenarioId: 'sc-001' },
  ip: '127.0.0.1',
  createdAt: new Date('2025-01-01T00:00:00Z'),
};

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      (prisma.auditLog.create as any).mockResolvedValue(mockAuditLog);

      const result = await auditService.log({
        userId: 'user-001',
        action: 'CREATE',
        resource: 'scenario',
        details: { scenarioId: 'sc-001' },
        ip: '127.0.0.1',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-001',
          action: 'CREATE',
          resource: 'scenario',
          details: { scenarioId: 'sc-001' },
          ip: '127.0.0.1',
        },
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle create action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({ ...mockAuditLog, action: 'CREATE' });

      await auditService.log({ action: 'CREATE', resource: 'atom' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'CREATE', resource: 'atom' }),
      });
    });

    it('should handle update action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({ ...mockAuditLog, action: 'UPDATE' });

      await auditService.log({ action: 'UPDATE', resource: 'scenario', details: { scenarioId: 'sc-001' } });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'UPDATE' }),
      });
    });

    it('should handle delete action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({ ...mockAuditLog, action: 'DELETE' });

      await auditService.log({ action: 'DELETE', resource: 'atom', details: { atomId: 'at-001' } });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'DELETE' }),
      });
    });

    it('should handle login action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({ ...mockAuditLog, action: 'LOGIN' });

      await auditService.log({ action: 'LOGIN', resource: 'auth', ip: '10.0.0.1' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'LOGIN', resource: 'auth' }),
      });
    });

    it('should handle export action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({ ...mockAuditLog, action: 'EXPORT' });

      await auditService.log({ action: 'EXPORT', resource: 'report', details: { format: 'xlsx' } });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'EXPORT' }),
      });
    });

    it('should log without optional fields', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({ ...mockAuditLog, userId: null, ip: null });

      await auditService.log({ action: 'READ', resource: 'scenario' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          action: 'READ',
          resource: 'scenario',
          details: undefined,
          ip: undefined,
        },
      });
    });
  });

  describe('query', () => {
    it('should query audit logs with default pagination', async () => {
      const logs = [mockAuditLog];
      (prisma.auditLog.findMany as any).mockResolvedValue(logs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      const result = await auditService.query({});

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.data).toEqual(logs);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, pages: 1 });
    });

    it('should filter by userId', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(0);

      await auditService.query({ userId: 'user-001' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-001' }) })
      );
    });

    it('should filter by action', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(0);

      await auditService.query({ action: 'CREATE' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ action: 'CREATE' }) })
      );
    });

    it('should filter by resource', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(0);

      await auditService.query({ resource: 'scenario' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ resource: 'scenario' }) })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(0);

      await auditService.query({ startDate, endDate });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        })
      );
    });

    it('should support custom pagination', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(50);

      const result = await auditService.query({ page: 2, limit: 10 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
      expect(result.pagination).toEqual({ page: 2, limit: 10, total: 50, pages: 5 });
    });

    it('should combine multiple filters', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(0);

      await auditService.query({
        userId: 'user-001',
        action: 'UPDATE',
        resource: 'scenario',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-001',
            action: 'UPDATE',
            resource: 'scenario',
          }),
        })
      );
    });
  });

  describe('getByUser', () => {
    it('should return logs for a specific user', async () => {
      const logs = [mockAuditLog];
      (prisma.auditLog.findMany as any).mockResolvedValue(logs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      const result = await auditService.getByUser('user-001');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-001' },
        })
      );
      expect(result.data).toEqual(logs);
    });

    it('should support pagination for user logs', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(25);

      const result = await auditService.getByUser('user-001', { page: 2, limit: 5 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 })
      );
      expect(result.pagination.page).toBe(2);
    });
  });

  describe('getByResource', () => {
    it('should return logs for a specific resource', async () => {
      const logs = [mockAuditLog];
      (prisma.auditLog.findMany as any).mockResolvedValue(logs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      const result = await auditService.getByResource('scenario');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resource: 'scenario' },
        })
      );
      expect(result.data).toEqual(logs);
    });

    it('should support pagination for resource logs', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.count as any).mockResolvedValue(30);

      const result = await auditService.getByResource('atom', { page: 3, limit: 10 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.total).toBe(30);
    });
  });

  describe('getStats', () => {
    it('should return audit statistics', async () => {
      (prisma.auditLog.count as any).mockResolvedValue(100);
      (prisma.auditLog.groupBy as any).mockResolvedValue([
        { action: 'CREATE', _count: { _all: 40 } },
        { action: 'UPDATE', _count: { _all: 35 } },
        { action: 'DELETE', _count: { _all: 10 } },
        { action: 'LOGIN', _count: { _all: 15 } },
      ]);

      const result = await auditService.getStats();

      expect(result.total).toBe(100);
      expect(result.byAction).toEqual([
        { action: 'CREATE', count: 40 },
        { action: 'UPDATE', count: 35 },
        { action: 'DELETE', count: 10 },
        { action: 'LOGIN', count: 15 },
      ]);
    });

    it('should return stats filtered by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      (prisma.auditLog.count as any).mockResolvedValue(50);
      (prisma.auditLog.groupBy as any).mockResolvedValue([]);

      await auditService.getStats({ startDate, endDate });

      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: { createdAt: { gte: startDate, lte: endDate } },
      });
    });

    it('should return empty stats when no logs exist', async () => {
      (prisma.auditLog.count as any).mockResolvedValue(0);
      (prisma.auditLog.groupBy as any).mockResolvedValue([]);

      const result = await auditService.getStats();

      expect(result.total).toBe(0);
      expect(result.byAction).toEqual([]);
    });
  });
});
