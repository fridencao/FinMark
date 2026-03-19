import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

export const strategyRouter: RouterType = Router();

strategyRouter.use(requireAuth);

strategyRouter.get('/abtests', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query as Record<string, unknown>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [tests, total] = await Promise.all([
      prisma.abTest.findMany({ where, skip: (Number(page) - 1) * Number(limit), take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.abTest.count({ where }),
    ]);
    res.json({ success: true, data: tests, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

strategyRouter.post('/abtests', async (req, res, next) => {
  try {
    const { name, type, description, branches, metric, startDate, endDate } = req.body as Record<string, unknown>;
    const test = await prisma.abTest.create({
      data: {
        name: name as string,
        type: (type as string) || 'content',
        description: description as string | undefined,
        branches: branches as object,
        metric: (metric as string) || 'conversion',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: 'draft',
      },
    });
    res.status(201).json({ success: true, data: test });
  } catch (err) { next(err); }
});

strategyRouter.post('/abtests/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await prisma.abTest.update({ where: { id }, data: { status: 'running' } });
    res.json({ success: true, data: test });
  } catch (err) { next(err); }
});

strategyRouter.post('/abtests/:id/stop', async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await prisma.abTest.update({ where: { id }, data: { status: 'paused' } });
    res.json({ success: true, data: test });
  } catch (err) { next(err); }
});

strategyRouter.get('/schedules', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query as Record<string, unknown>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [schedules, total] = await Promise.all([
      prisma.taskSchedule.findMany({ where, skip: (Number(page) - 1) * Number(limit), take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.taskSchedule.count({ where }),
    ]);
    res.json({ success: true, data: schedules, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

strategyRouter.post('/schedules', async (req, res, next) => {
  try {
    const { name, scenarioId, triggerType, triggerConfig, targetSegment, channels } = req.body as Record<string, unknown>;
    const schedule = await prisma.taskSchedule.create({
      data: {
        name: name as string,
        scenarioId: scenarioId as string | undefined,
        triggerType: (triggerType as string) || 'fixed',
        triggerConfig: triggerConfig as object | undefined,
        targetSegment: targetSegment as string | undefined,
        channels: (channels as string[]) || [],
        status: 'active',
      },
    });
    res.status(201).json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

strategyRouter.post('/schedules/:id/pause', async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.taskSchedule.update({ where: { id }, data: { status: 'paused' } });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

strategyRouter.post('/schedules/:id/resume', async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.taskSchedule.update({ where: { id }, data: { status: 'active' } });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});
