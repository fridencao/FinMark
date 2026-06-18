import { prisma } from '../config/database.js';
import type { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  details?: unknown;
  ip?: string;
}

export interface AuditQueryFilters {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const auditService = {
  async log(entry: AuditLogEntry) {
    return prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        details: entry.details as Prisma.InputJsonValue | undefined,
        ip: entry.ip,
      },
    });
  },

  async query(filters: AuditQueryFilters): Promise<PaginatedResult<any>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.AuditLogWhereInput = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async getByUser(userId: string, opts?: { page?: number; limit?: number }) {
    return this.query({ userId, ...opts });
  },

  async getByResource(resource: string, opts?: { page?: number; limit?: number }) {
    return this.query({ resource, ...opts });
  },

  async getStats(filters?: { startDate?: Date; endDate?: Date }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [total, byAction] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' as const } as unknown as Prisma.AuditLogCountOrderByAggregateInput },
      }),
    ]);

    return {
      total,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: (item._count as { _all: number })._all,
      })),
    };
  },
};
