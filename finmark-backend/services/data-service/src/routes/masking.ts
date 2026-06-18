import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';
import {
  maskPhone,
  maskIdNumber,
  maskName,
  maskEmail,
  maskBankCard,
  maskAUM,
  maskObject,
  maskArray,
  createMaskingRule,
  deleteMaskingRule,
  getMaskingRules,
  applyMaskingPolicy,
} from '../services/maskingService.js';

export const maskingRouter: RouterType = Router();

maskingRouter.use(requireAuth);

const MASK_FNS: Record<string, (val: any) => any> = {
  phone: maskPhone,
  idNumber: maskIdNumber,
  name: maskName,
  email: maskEmail,
  bankCard: maskBankCard,
  aum: maskAUM,
};

maskingRouter.post('/mask',
  body('type').isString().notEmpty().isIn(['phone', 'idNumber', 'name', 'email', 'bankCard', 'aum']),
  body('value').exists(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { type, value } = req.body;
      const fn = MASK_FNS[type];
      if (!fn) throw new ValidationError('Unknown mask type');

      const masked = fn(value);
      res.json({ success: true, data: { masked, original: value, type } });
    } catch (err) { next(err); }
  }
);

maskingRouter.post('/mask/object',
  body('data').isObject(),
  body('fieldMappings').optional().isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { data, fieldMappings } = req.body;
      const masked = maskObject(data, fieldMappings);
      res.json({ success: true, data: masked });
    } catch (err) { next(err); }
  }
);

maskingRouter.post('/mask/array',
  body('data').isArray(),
  body('fieldMappings').optional().isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { data, fieldMappings } = req.body;
      const masked = maskArray(data, fieldMappings);
      res.json({ success: true, data: masked });
    } catch (err) { next(err); }
  }
);

maskingRouter.get('/rules',
  async (_req, res, next) => {
    try {
      const rules = getMaskingRules();
      res.json({ success: true, data: rules });
    } catch (err) { next(err); }
  }
);

maskingRouter.post('/rules',
  body('name').isString().notEmpty(),
  body('fieldName').isString().notEmpty(),
  body('maskPattern').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { name, fieldName, maskPattern } = req.body;

      const maskFn = (val: string): string => {
        if (!maskPattern) return val.replace(/./g, '*');
        return val.replace(new RegExp(maskPattern, 'g'), '*');
      };

      const rule = createMaskingRule({ name, fieldName, maskFn });
      res.status(201).json({ success: true, data: rule });
    } catch (err) { next(err); }
  }
);

maskingRouter.delete('/rules/:id',
  param('id').isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const deleted = deleteMaskingRule(req.params!.id);
      if (!deleted) throw new ValidationError('Rule not found');

      res.json({ success: true, message: 'Rule deleted successfully' });
    } catch (err) { next(err); }
  }
);
