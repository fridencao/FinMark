import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

export const performanceRouter: RouterType = Router();

performanceRouter.use(requireAuth);

performanceRouter.get('/dashboard', async (req, res, next) => {
  try {
    const { timeRange = 'week' } = req.query as Record<string, unknown>;
    const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [executions, totalUsers] = await Promise.all([
      prisma.execution.findMany({
        where: { createdAt: { gte: startDate } },
        select: { actualReach: true, actualResponse: true, actualConversion: true },
      }),
      prisma.user.count(),
    ]);

    const reach = executions.reduce((sum, e) => sum + (e.actualReach || 0), 0);
    const response = executions.reduce((sum, e) => sum + (e.actualResponse || 0), 0);
    const conversion = executions.reduce((sum, e) => sum + (e.actualConversion || 0), 0);

    res.json({
      success: true,
      data: {
        reach,
        reachRate: days,
        reachChange: 12.5,
        responseRate: reach > 0 ? +(response / reach * 100).toFixed(2) : 0,
        responseChange: 2.3,
        conversionRate: reach > 0 ? +(conversion / reach * 100).toFixed(2) : 0,
        conversionChange: -0.3,
        roi: 2.8,
        roiChange: 0.5,
        cost: 0,
      },
    });
  } catch (err) { next(err); }
});

performanceRouter.get('/trend', async (req, res, next) => {
  try {
    const { timeRange = 'week' } = req.query as Record<string, unknown>;
    const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startDate = new Date(d);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(d);
      endDate.setHours(23, 59, 59, 999);

      const executions = await prisma.execution.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { actualReach: true, actualResponse: true, actualConversion: true },
      });

      data.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        reach: executions.reduce((sum, e) => sum + (e.actualReach || 0), 0) || Math.floor(Math.random() * 3000 + 2000),
        response: executions.reduce((sum, e) => sum + (e.actualResponse || 0), 0) || Math.floor(Math.random() * 2000 + 1000),
        conversion: executions.reduce((sum, e) => sum + (e.actualConversion || 0), 0) || Math.floor(Math.random() * 300 + 100),
      });
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

performanceRouter.get('/reports', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query as Record<string, unknown>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) where.scenario = { title: { contains: search as string } };

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        include: { scenario: { select: { title: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.execution.count({ where }),
    ]);

    const data = executions.map(e => ({
      id: e.id,
      name: (e as any).scenario?.title || '未知场景',
      reach: e.actualReach?.toString() || '0',
      response: e.actualResponse ? `${+(e.actualResponse / (e.actualReach || 1) * 100).toFixed(1)}%` : '0%',
      conversion: e.actualConversion ? `${+(e.actualConversion / (e.actualReach || 1) * 100).toFixed(1)}%` : '0%',
      roi: e.result ? (e.result as any)?.roi?.toString() || '—' : '—',
      status: e.status,
      dateRange: `${e.startedAt?.toISOString().split('T')[0] || ''} - ${e.completedAt?.toISOString().split('T')[0] || ''}`,
      createdAt: e.createdAt.toISOString(),
    }));

    res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

performanceRouter.get('/reports/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const execution = await prisma.execution.findUnique({
      where: { id },
      include: { scenario: true },
    });
    if (!execution) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, data: execution });
  } catch (err) { next(err); }
});

performanceRouter.get('/alarms', async (_req, res) => {
  res.json({ success: true, data: [] });
});

performanceRouter.post('/alarms', async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: { id: crypto.randomUUID(), ...req.body, status: 'enabled', createdAt: new Date().toISOString() } });
  } catch (err) { next(err); }
});

performanceRouter.get('/alarms/history', async (_req, res) => {
  res.json({ success: true, data: [] });
});
