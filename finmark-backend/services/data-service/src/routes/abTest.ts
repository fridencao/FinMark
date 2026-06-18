import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import * as abTestService from '../services/abTestService.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const abTestRouter: RouterType = Router();

abTestRouter.use(requireAuth);

abTestRouter.post(
  '/',
  body('name').isString().notEmpty(),
  body('type').isString().notEmpty(),
  body('branches').isArray({ min: 2 }),
  body('metric').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as any;
      const test = await abTestService.createTest({
        name: b.name,
        type: b.type,
        description: b.description,
        branches: b.branches,
        metric: b.metric,
      });

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'abTest', { testId: test.id }, ip);

      res.status(201).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }
);

abTestRouter.get(
  '/',
  async (req, res, next) => {
    try {
      const { status } = req.query as Record<string, unknown>;
      const result = await abTestService.listTests(
        status ? { status: status as string } : undefined
      );
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }
);

abTestRouter.get(
  '/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const test = await abTestService.getTestById(req.params!.id);
      if (!test) return next(new NotFoundError('AbTest'));

      res.json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }
);

abTestRouter.post(
  '/:id/start',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const test = await abTestService.startTest(req.params!.id);

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'EXECUTE', 'abTest', { testId: test.id, action: 'start' }, ip);

      res.json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }
);

abTestRouter.post(
  '/:id/stop',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const test = await abTestService.stopTest(req.params!.id);

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'EXECUTE', 'abTest', { testId: test.id, action: 'stop' }, ip);

      res.json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }
);

abTestRouter.post(
  '/:id/convert',
  param('id').isUUID(),
  body('branchId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as { branchId: string };
      const test = await abTestService.recordConversion(req.params!.id, b.branchId);

      res.json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }
);

abTestRouter.get(
  '/:id/results',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const results = await abTestService.getResults(req.params!.id);

      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }
);
