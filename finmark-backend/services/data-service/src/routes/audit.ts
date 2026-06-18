import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { query, param, validationResult } from 'express-validator';
import { auditService } from '../services/auditService.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';

export const auditRouter: RouterType = Router();

auditRouter.use(requireAuth);

auditRouter.get('/',
  query('userId').optional().isString(),
  query('action').optional().isString(),
  query('resource').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { userId, action, resource, startDate, endDate, page, limit } = req.query as Record<string, unknown>;

      const result = await auditService.query({
        userId: userId as string | undefined,
        action: action as string | undefined,
        resource: resource as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page as number | undefined,
        limit: limit as number | undefined,
      });

      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) { next(err); }
  }
);

auditRouter.get('/user/:userId',
  param('userId').isString().notEmpty(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { page, limit } = req.query as Record<string, unknown>;
      const result = await auditService.getByUser(req.params.userId, {
        page: page as number | undefined,
        limit: limit as number | undefined,
      });

      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) { next(err); }
  }
);

auditRouter.get('/resource/:resource',
  param('resource').isString().notEmpty(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { page, limit } = req.query as Record<string, unknown>;
      const result = await auditService.getByResource(req.params.resource, {
        page: page as number | undefined,
        limit: limit as number | undefined,
      });

      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) { next(err); }
  }
);

auditRouter.get('/stats',
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { startDate, endDate } = req.query as Record<string, unknown>;

      const result = await auditService.getStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
);
