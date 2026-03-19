import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const scenarioRouter: RouterType = Router();

scenarioRouter.use(requireAuth);

scenarioRouter.get('/',
  query('category').optional().isString(),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { category, status, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (category) where.category = category;
      if (status) where.status = status;

      const [scenarios, total] = await Promise.all([
        prisma.scenario.findMany({
          where, skip: (Number(page) - 1) * Number(limit), take: Number(limit), orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, goal: true, category: true, icon: true, color: true, status: true, complianceScore: true, riskLevel: true, isCustom: true, createdAt: true, updatedAt: true, _count: { select: { executions: true } } },
        }),
        prisma.scenario.count({ where }),
      ]);

      res.json({ success: true, data: scenarios, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (err) { next(err); }
  }
);

scenarioRouter.get('/defaults', async (_req, res, next) => {
  try {
    const defaults = await prisma.scenario.findMany({ where: { isCustom: false }, orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: defaults });
  } catch (err) { next(err); }
});

scenarioRouter.get('/categories', (_req, res) => {
  res.json({ success: true, data: [
    { value: 'acquisition', label: '获客期' }, { value: 'growth', label: '成长期' },
    { value: 'mature', label: '成熟期' }, { value: 'declining', label: '衰退期' }, { value: 'recovery', label: '挽回期' },
  ]});
});

scenarioRouter.get('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      const scenario = await prisma.scenario.findUnique({ where: { id }, include: { executions: { orderBy: { createdAt: 'desc' }, take: 10 } } });
      if (!scenario) return next(new NotFoundError('Scenario'));
      res.json({ success: true, data: scenario });
    } catch (err) { next(err); }
  }
);

scenarioRouter.post('/',
  body('title').isString().notEmpty(),
  body('goal').isString().notEmpty(),
  body('category').isIn(['acquisition', 'growth', 'mature', 'declining', 'recovery']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const scenario = await prisma.scenario.create({
        data: { title: b.title as string, goal: b.goal as string, category: b.category as any, icon: b.icon as string | undefined, color: b.color as string | undefined, config: b.config as object | undefined, isCustom: true },
      });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'scenario', { scenarioId: scenario.id }, ip);
      res.status(201).json({ success: true, data: scenario });
    } catch (err) { next(err); }
  }
);

scenarioRouter.put('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const id = req.params?.id as string;
      const data: Record<string, unknown> = {};
      if (b.title) data.title = b.title;
      if (b.goal) data.goal = b.goal;
      if (b.category) data.category = b.category;
      if (b.config) data.config = b.config;
      if (b.status) data.status = b.status;
      if (b.icon !== undefined) data.icon = b.icon;
      if (b.color !== undefined) data.color = b.color;
      const scenario = await prisma.scenario.update({ where: { id }, data });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'UPDATE', 'scenario', { scenarioId: scenario.id }, ip);
      res.json({ success: true, data: scenario });
    } catch (err) { next(err); }
  }
);

scenarioRouter.delete('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      await prisma.scenario.delete({ where: { id } });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'scenario', { scenarioId: id }, ip);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

scenarioRouter.post('/generate',
  body('description').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const { description } = req.body as { description: string };
      res.json({ success: true, data: { title: `AI Generated: ${description.slice(0, 20)}...`, goal: description, category: 'growth', config: {} } });
    } catch (err) { next(err); }
  }
);

scenarioRouter.post('/:id/execute',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      const scenario = await prisma.scenario.findUnique({ where: { id } });
      if (!scenario) return next(new NotFoundError('Scenario'));
      const execution = await prisma.execution.create({ data: { scenarioId: scenario.id, status: 'pending', config: req.body } });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'EXECUTE', 'scenario', { scenarioId: scenario.id, executionId: execution.id }, ip);
      res.status(201).json({ success: true, data: execution });
    } catch (err) { next(err); }
  }
);
