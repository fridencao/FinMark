import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';
import * as agentConfigService from '../services/agentConfigService.js';

export const agentConfigRouter: RouterType = Router();
agentConfigRouter.use(requireAuth);

agentConfigRouter.get('/configs', async (_req, res, next) => {
  try {
    const configs = await agentConfigService.getAllConfigs();
    res.json({ success: true, data: configs });
  } catch (err) { next(err); }
});

agentConfigRouter.get('/configs/:agentType', param('agentType').isString(), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
    const config = await agentConfigService.getConfigByType(req.params.agentType);
    if (!config) return res.status(404).json({ success: false, error: 'Agent type not found' });
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

agentConfigRouter.put('/configs/:agentType',
  requireRole('admin'),
  param('agentType').isString(),
  body('name').optional().isString(),
  body('prompt').optional().isString(),
  body('modelId').optional().isString(),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  body('maxTokens').optional().isInt({ min: 256, max: 131072 }),
  body('enabled').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const config = await agentConfigService.updateConfig(req.params.agentType, req.body);
      res.json({ success: true, data: config });
    } catch (err) { next(err); }
  }
);

agentConfigRouter.post('/configs/:agentType/toggle',
  requireRole('admin'),
  param('agentType').isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const config = await agentConfigService.toggleConfig(req.params.agentType);
      res.json({ success: true, data: config });
    } catch (err) { next(err); }
  }
);
