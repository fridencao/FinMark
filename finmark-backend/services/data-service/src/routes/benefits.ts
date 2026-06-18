import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { param, body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';
import { healthCheck, listBenefits, getBenefit, validateBenefit } from '../services/benefitService.js';

export const benefitsRouter: RouterType = Router();

benefitsRouter.use(requireAuth);

benefitsRouter.get('/health', async (_req, res, next) => {
  try {
    const result = await healthCheck();
    if (result.status === 'connected') {
      res.json({ success: true, data: result });
    } else if (result.status === 'disconnected') {
      res.json({ success: true, data: result });
    } else {
      res.status(503).json({ success: false, data: result });
    }
  } catch (err) { next(err); }
});

benefitsRouter.get('/', async (_req, res, next) => {
  try {
    const benefits = await listBenefits();
    res.json({ success: true, data: benefits });
  } catch (err) { next(err); }
});

benefitsRouter.get('/:id',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const id = req.params?.id as string;
      const benefit = await getBenefit(id);
      res.json({ success: true, data: benefit });
    } catch (err) { next(err); }
  }
);

benefitsRouter.post('/validate',
  body('benefitId').isString().notEmpty(),
  body('userId').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { benefitId, userId } = req.body as { benefitId: string; userId?: string };
      const result = await validateBenefit(benefitId, userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
);