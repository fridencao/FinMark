import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import * as alarmService from '../services/alarmService.js';
import * as alarmWorkflowService from '../services/alarmWorkflowService.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const alarmRouter: RouterType = Router();

alarmRouter.use(requireAuth);

// GET /api/alarms/rules - List all alarm rules
alarmRouter.get(
  '/rules',
  query('enabled').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const rules = await alarmService.getAllRules();
      res.json({ success: true, data: rules });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/alarms/rules/:id - Get single rule
alarmRouter.get(
  '/rules/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const rule = await alarmService.getRuleById(req.params.id);
      if (!rule) return next(new NotFoundError('AlarmRule'));

      res.json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/rules - Create alarm rule
alarmRouter.post(
  '/rules',
  body('name').isString().notEmpty(),
  body('metric').isIn([
    'reach_rate',
    'conversion_rate',
    'roi',
    'complaint_count',
    'compliance_score',
  ]),
  body('condition').isIn(['lt', 'gt', 'lte', 'gte', 'eq']),
  body('threshold').isFloat({ min: 0 }),
  body('level').isIn(['warning', 'critical']),
  body('channels').isArray(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as any;
      const rule = await alarmService.createRule({
        name: b.name,
        metric: b.metric,
        condition: b.condition,
        threshold: b.threshold,
        level: b.level,
        channels: b.channels,
      });

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'alarmRule', { ruleId: rule.id }, ip);

      res.status(201).json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/alarms/rules/:id - Update alarm rule
alarmRouter.put(
  '/rules/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as any;
      const rule = await alarmService.updateRule(req.params.id, b);

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'UPDATE', 'alarmRule', { ruleId: rule.id }, ip);

      res.json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/alarms/rules/:id - Delete alarm rule
alarmRouter.delete(
  '/rules/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      await alarmService.deleteRule(req.params.id);

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'alarmRule', { ruleId: req.params.id }, ip);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/rules/:id/toggle - Toggle rule enabled/disabled
alarmRouter.post(
  '/rules/:id/toggle',
  param('id').isUUID(),
  body('enabled').isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const rule = await alarmService.toggleRule(req.params.id, req.body.enabled);
      res.json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/alarms/history - Get alarm history
alarmRouter.get(
  '/history',
  query('ruleId').optional().isUUID(),
  query('status').optional().isIn(['triggered', 'resolved', 'acknowledged']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const history = await alarmService.getHistory(
        req.query.ruleId as string | undefined,
        req.query.status as string | undefined
      );
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/history/:id/acknowledge - Acknowledge alarm
alarmRouter.post(
  '/history/:id/acknowledge',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const alarm = await alarmService.acknowledgeAlarm(req.params.id);
      res.json({ success: true, data: alarm });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/history/:id/resolve - Resolve alarm
alarmRouter.post(
  '/history/:id/resolve',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const alarm = await alarmService.resolveAlarm(req.params.id);
      res.json({ success: true, data: alarm });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/:id/acknowledge - Acknowledge an alarm
alarmRouter.post(
  '/:id/acknowledge',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const alarm = await alarmWorkflowService.acknowledgeAlarm(req.params.id);
      res.json({ success: true, data: alarm });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/:id/process - Start processing
alarmRouter.post(
  '/:id/process',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const alarm = await alarmWorkflowService.startProcessing(req.params.id);
      res.json({ success: true, data: alarm });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/:id/resolve - Resolve alarm
alarmRouter.post(
  '/:id/resolve',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const alarm = await alarmWorkflowService.resolveAlarm(req.params.id);
      res.json({ success: true, data: alarm });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/:id/comment - Add comment
alarmRouter.post(
  '/:id/comment',
  param('id').isUUID(),
  body('author').isString().notEmpty(),
  body('content').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { author, content } = req.body;
      const alarm = await alarmWorkflowService.addComment(req.params.id, author, content);
      res.json({ success: true, data: alarm });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/alarms/:id/details - Get alarm details with history
alarmRouter.get(
  '/:id/details',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const alarm = await alarmWorkflowService.getAlarmDetails(req.params.id);
      if (!alarm) return next(new NotFoundError('Alarm'));
      res.json({ success: true, data: alarm });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/alarms/stats - Get alarm statistics
alarmRouter.get(
  '/stats',
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await alarmWorkflowService.getAlarmStats(startDate, endDate);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/alarms/evaluate - Trigger manual evaluation
alarmRouter.post(
  '/evaluate',
  async (req, res, next) => {
    try {
      await alarmService.triggerManualEvaluation();
      res.json({ success: true, message: 'Alarm evaluation triggered' });
    } catch (err) {
      next(err);
    }
  }
);
