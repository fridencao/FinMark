import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import * as taskScheduleService from '../services/taskScheduleService.js';

export const taskScheduleRouter: RouterType = Router();

taskScheduleRouter.use(requireAuth);

taskScheduleRouter.get('/',
  query('status').optional().isIn(['active', 'paused', 'completed']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { status, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const { prisma } = await import('../config/database.js');
      const [schedules, total] = await Promise.all([
        prisma.taskSchedule.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.taskSchedule.count({ where }),
      ]);

      res.json({
        success: true,
        data: schedules,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) { next(err); }
  }
);

taskScheduleRouter.get('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { prisma } = await import('../config/database.js');
      const schedule = await prisma.taskSchedule.findUnique({
        where: { id: req.params.id },
        include: { executions: { orderBy: { startedAt: 'desc' }, take: 10 } },
      });
      if (!schedule) return next(new NotFoundError('TaskSchedule'));
      res.json({ success: true, data: schedule });
    } catch (err) { next(err); }
  }
);

taskScheduleRouter.post('/',
  body('name').isString().notEmpty(),
  body('triggerType').isIn(['cron', 'once', 'event']),
  body('channels').isArray(),
  body('scenarioId').optional().isString(),
  body('triggerConfig').optional().isObject(),
  body('targetSegment').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as Record<string, unknown>;
      const schedule = await taskScheduleService.createSchedule({
        name: b.name as string,
        scenarioId: b.scenarioId as string | undefined,
        triggerType: b.triggerType as string,
        triggerConfig: b.triggerConfig as Record<string, unknown> | undefined,
        targetSegment: b.targetSegment as string | undefined,
        channels: b.channels as string[],
      });

      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'taskSchedule', { scheduleId: schedule.id }, ip);
      res.status(201).json({ success: true, data: schedule });
    } catch (err) { next(err); }
  }
);

taskScheduleRouter.put('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as Record<string, unknown>;
      const schedule = await taskScheduleService.updateSchedule(req.params.id, {
        name: b.name as string | undefined,
        scenarioId: b.scenarioId as string | undefined,
        triggerType: b.triggerType as string | undefined,
        triggerConfig: b.triggerConfig as Record<string, unknown> | undefined,
        targetSegment: b.targetSegment as string | undefined,
        channels: b.channels as string[] | undefined,
      });

      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'UPDATE', 'taskSchedule', { scheduleId: schedule.id }, ip);
      res.json({ success: true, data: schedule });
    } catch (err) { next(err); }
  }
);

taskScheduleRouter.delete('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      await taskScheduleService.deleteSchedule(req.params.id);
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'taskSchedule', { scheduleId: req.params.id }, ip);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

taskScheduleRouter.post('/:id/pause',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const schedule = await taskScheduleService.pauseSchedule(req.params.id);
      res.json({ success: true, data: schedule });
    } catch (err) { next(err); }
  }
);

taskScheduleRouter.post('/:id/resume',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const schedule = await taskScheduleService.resumeSchedule(req.params.id);
      res.json({ success: true, data: schedule });
    } catch (err) { next(err); }
  }
);

taskScheduleRouter.get('/:id/history',
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { page, limit, status } = req.query as Record<string, unknown>;
      const result = await taskScheduleService.getScheduleHistory(req.params.id, {
        page: page as number | undefined,
        limit: limit as number | undefined,
        status: status as string | undefined,
      });
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }
);
