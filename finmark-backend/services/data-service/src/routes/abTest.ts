import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import * as abTestService from '../services/abTestService.js';
import * as abTestEventService from '../services/abTestEventService.js';
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

      // 将后端分支字段(weight/impressions/conversions)映射为前端契约(traffic/sampleSize/conversionCount)
      const branches = (test.branches as unknown as Array<Record<string, any>>).map((b) => ({
        id: b.id,
        name: b.name,
        traffic: typeof b.weight === 'number' ? b.weight : (typeof b.traffic === 'number' ? b.traffic : 0),
        sampleSize: typeof b.impressions === 'number' ? b.impressions : (typeof b.sampleSize === 'number' ? b.sampleSize : 0),
        conversionCount: typeof b.conversions === 'number' ? b.conversions : (typeof b.conversionCount === 'number' ? b.conversionCount : 0),
      }));

      res.json({ success: true, data: { ...test, branches } });
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
  '/:id/conversions',
  param('id').isUUID(),
  body('branchId').isString().notEmpty(),
  body('count').optional().isInt({ min: 1 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as { branchId: string; count?: number };
      const test = await abTestService.recordConversion(
        req.params!.id,
        b.branchId,
        typeof b.count === 'number' ? b.count : 1
      );

      res.json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }
);

abTestRouter.post(
  '/:id/events',
  param('id').isUUID(),
  body('events').isArray({ min: 1, max: 5000 }),
  body('events.*.branchId').isString().notEmpty(),
  body('events.*.source').isString().notEmpty(),
  body('events.*.eventId').optional().isString(),
  body('events.*.customerId').optional().isString(),
  body('events.*.channel').optional().isString(),
  body('events.*.value').optional().isFloat({ min: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { events } = req.body as { events: Array<{
        branchId: string;
        source: string;
        eventId?: string;
        customerId?: string;
        channel?: string;
        value?: number;
      }> };

      const result = await abTestEventService.ingestEvents(
        req.params!.id,
        events.map((e) => ({
          branchId: e.branchId,
          source: e.source as Parameters<typeof abTestEventService.ingestEvents>[1][number]['source'],
          ...(e.eventId !== undefined ? { eventId: e.eventId } : {}),
          ...(e.customerId !== undefined ? { customerId: e.customerId } : {}),
          ...(e.channel !== undefined ? { channel: e.channel } : {}),
          ...(e.value !== undefined ? { value: e.value } : {}),
        })),
      );

      res.json({ success: true, data: result });
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
