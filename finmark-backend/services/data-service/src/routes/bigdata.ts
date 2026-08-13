/**
 * /api/bigdata/* — 把后端 bigDataService(原本只能服务进程内)暴露成 HTTP,
 * 让前端能调,而不必直接打 GraphQL 端点。
 *
 * 大数据返回结构比较大;默认 60s timeout,GraphQL 默认 10s,够用。
 */
import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';
import { bigDataService } from '../services/bigDataService.js';

export const bigDataRouter: RouterType = Router();
bigDataRouter.use(requireAuth);

bigDataRouter.get(
  '/customers/:id/segment',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const data = await bigDataService.getCustomerSegment(req.params!.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

bigDataRouter.get(
  '/customers/:id/behavior',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const days = Number(req.query.days) || 30;
      const data = await bigDataService.getCustomerBehavior(req.params!.id, days);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

bigDataRouter.get(
  '/segments/:id/customers',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const q = (req.query ?? {}) as Record<string, string | undefined>;
      const filters = {
        minAsset: q.minAsset ? Number(q.minAsset) : undefined,
        maxAsset: q.maxAsset ? Number(q.maxAsset) : undefined,
        ageRange: q.ageMin && q.ageMax ? [Number(q.ageMin), Number(q.ageMax)] as [number, number] : undefined,
        city: q.city,
      };
      const data = await bigDataService.searchSegmentCustomers(req.params!.id, filters);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

bigDataRouter.post(
  '/audience/preview',
  body('conditions').isArray(),
  body('limit').optional().isInt({ min: 1, max: 1000 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const { conditions, limit = 1000 } = req.body as { conditions: unknown[]; limit?: number };
      const data = await bigDataService.getAudiencePreview(conditions, limit);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);
