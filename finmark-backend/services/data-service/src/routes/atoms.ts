import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const atomRouter: RouterType = Router();

atomRouter.use(requireAuth);

atomRouter.get('/',
  query('type').optional().isIn(['hook', 'channel', 'content', 'risk']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const { type, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (type) where.type = type;
      const [atoms, total] = await Promise.all([
        prisma.atom.findMany({ where, skip: (Number(page) - 1) * Number(limit), take: Number(limit), orderBy: { usageCount: 'desc' } }),
        prisma.atom.count({ where }),
      ]);
      res.json({ success: true, data: atoms, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (err) { next(err); }
  }
);

atomRouter.get('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      const atom = await prisma.atom.findUnique({ where: { id } });
      if (!atom) return next(new NotFoundError('Atom'));
      res.json({ success: true, data: atom });
    } catch (err) { next(err); }
  }
);

atomRouter.post('/',
  body('name').isString().notEmpty(),
  body('type').isIn(['hook', 'channel', 'content', 'risk']),
  body('description').optional().isString(),
  body('successRate').optional().isFloat({ min: 0, max: 100 }),
  body('tags').optional().isArray(),
  body('config').optional().isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const atom = await prisma.atom.create({
        data: { name: b.name as string, type: b.type as 'hook', description: b.description as string | undefined, successRate: b.successRate as number | undefined, tags: (b.tags as string[]) || [], config: b.config as object | undefined, scenarios: (b.scenarios as string[]) || [] },
      });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'atom', { atomId: atom.id }, ip);
      res.status(201).json({ success: true, data: atom });
    } catch (err) { next(err); }
  }
);

atomRouter.put('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      const b = req.body as Record<string, unknown>;
      const atom = await prisma.atom.update({ where: { id }, data: b });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'UPDATE', 'atom', { atomId: atom.id }, ip);
      res.json({ success: true, data: atom });
    } catch (err) { next(err); }
  }
);

atomRouter.delete('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      await prisma.atom.delete({ where: { id } });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'atom', { atomId: id }, ip);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);
