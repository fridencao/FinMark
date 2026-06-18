import { prisma } from '../config/database.js';
import type { Prisma } from '@prisma/client';

export interface LogModelCallInput {
  modelName: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  agentType?: string;
}

export interface StatsFilters {
  startDate?: Date;
  endDate?: Date;
  modelName?: string;
}

function buildDateWhere(filters: StatsFilters): Prisma.ModelCallLogWhereInput {
  const where: Prisma.ModelCallLogWhereInput = {};
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  if (filters.modelName) where.modelName = filters.modelName;
  return where;
}

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export const monitoringService = {
  async logModelCall(input: LogModelCallInput) {
    return prisma.modelCallLog.create({
      data: {
        modelName: input.modelName,
        provider: input.provider,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        totalTokens: input.totalTokens,
        responseTime: input.responseTime,
        success: input.success,
        errorMessage: input.errorMessage,
        agentType: input.agentType,
      },
    });
  },

  async getModelCallStats(filters: StatsFilters) {
    const where = buildDateWhere(filters);

    const [totalCalls, byModel, totals] = await Promise.all([
      prisma.modelCallLog.count({ where }),
      prisma.modelCallLog.groupBy({
        by: ['modelName'],
        where,
        _count: { _all: true },
        _avg: { responseTime: true },
        _sum: { totalTokens: true },
      }),
      prisma.modelCallLog.aggregate({
        where,
        _avg: { responseTime: true },
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      }),
    ]);

    return {
      totalCalls,
      avgResponseTime: Math.round(totals._avg.responseTime || 0),
      totalTokens: totals._sum.totalTokens || 0,
      totalPromptTokens: totals._sum.promptTokens || 0,
      totalCompletionTokens: totals._sum.completionTokens || 0,
      byModel: byModel.map((m) => ({
        modelName: m.modelName,
        count: m._count._all,
        avgResponseTime: Math.round(m._avg.responseTime || 0),
        totalTokens: m._sum.totalTokens || 0,
      })),
    };
  },

  async getResponseTimeStats(filters: StatsFilters) {
    const where = buildDateWhere(filters);

    const [responseTimes, agg] = await Promise.all([
      prisma.modelCallLog.findMany({
        where,
        select: { responseTime: true },
        orderBy: { responseTime: 'asc' },
      }),
      prisma.modelCallLog.aggregate({
        where,
        _avg: { responseTime: true },
        _min: { responseTime: true },
        _max: { responseTime: true },
      }),
    ]);

    const sorted = responseTimes.map((r) => r.responseTime);

    return {
      avg: Math.round(agg._avg.responseTime || 0),
      min: agg._min.responseTime || 0,
      max: agg._max.responseTime || 0,
      p50: computePercentile(sorted, 50),
      p95: computePercentile(sorted, 95),
      p99: computePercentile(sorted, 99),
      sampleSize: sorted.length,
    };
  },

  async getUsageStats(filters: StatsFilters) {
    const where = buildDateWhere(filters);

    const byModel = await prisma.modelCallLog.groupBy({
      by: ['modelName'],
      where,
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
      _count: { _all: true },
    });

    const models = byModel.map((m) => ({
      modelName: m.modelName,
      promptTokens: m._sum.promptTokens || 0,
      completionTokens: m._sum.completionTokens || 0,
      totalTokens: m._sum.totalTokens || 0,
      callCount: m._count._all,
    }));

    return {
      byModel: models,
      totalPromptTokens: models.reduce((s, m) => s + m.promptTokens, 0),
      totalCompletionTokens: models.reduce((s, m) => s + m.completionTokens, 0),
      totalTokens: models.reduce((s, m) => s + m.totalTokens, 0),
    };
  },

  async getErrorStats(filters: StatsFilters) {
    const where = buildDateWhere(filters);
    const errorWhere: Prisma.ModelCallLogWhereInput = { ...where, success: false };

    const [totalCalls, errorCalls, byError] = await Promise.all([
      prisma.modelCallLog.count({ where }),
      prisma.modelCallLog.count({ where: errorWhere }),
      prisma.modelCallLog.groupBy({
        by: ['errorMessage'],
        where: errorWhere,
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' as const } as unknown as Prisma.ModelCallLogCountOrderByAggregateInput },
      }),
    ]);

    return {
      totalCalls,
      errorCalls,
      errorRate: totalCalls > 0 ? +((errorCalls / totalCalls) * 100).toFixed(2) : 0,
      byError: byError.map((e) => ({
        error: e.errorMessage || 'Unknown',
        count: (e._count as { _all: number })._all,
      })),
    };
  },

  async getDailyStats(filters: StatsFilters) {
    const where = buildDateWhere(filters);

    const raw = await prisma.modelCallLog.groupBy({
      by: ['createdAt'],
      where,
      _count: { _all: true },
      _avg: { responseTime: true },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, { count: number; totalResponseTime: number; totalTokens: number; promptTokens: number; completionTokens: number; samples: number }>();

    for (const row of raw) {
      const dateKey = row.createdAt.toISOString().split('T')[0];
      const existing = byDay.get(dateKey) || { count: 0, totalResponseTime: 0, totalTokens: 0, promptTokens: 0, completionTokens: 0, samples: 0 };
      existing.count += row._count._all;
      existing.totalResponseTime += (row._avg.responseTime || 0) * row._count._all;
      existing.totalTokens += row._sum.totalTokens || 0;
      existing.promptTokens += row._sum.promptTokens || 0;
      existing.completionTokens += row._sum.completionTokens || 0;
      existing.samples += row._count._all;
      byDay.set(dateKey, existing);
    }

    return Array.from(byDay.entries()).map(([date, d]) => ({
      date,
      totalCalls: d.count,
      avgResponseTime: d.samples > 0 ? Math.round(d.totalResponseTime / d.samples) : 0,
      totalTokens: d.totalTokens,
      promptTokens: d.promptTokens,
      completionTokens: d.completionTokens,
    }));
  },
};
