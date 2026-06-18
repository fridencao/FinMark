import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { ValidationError } from '../middleware/error.js';
import { healthCheck, listChannels, dispatch, receiveFeedback } from '../services/channelService.js';

export const channelsRouter: RouterType = Router();

channelsRouter.get('/health', async (_req, res, next) => {
  try {
    const result = await healthCheck();
    const status = result.status === 'connected' ? 200 : result.status === 'disconnected' ? 200 : 503;
    res.status(status).json({ success: result.status === 'connected', data: result });
  } catch (err) { next(err); }
});

channelsRouter.get('/', async (_req, res, next) => {
  try {
    const channels = await listChannels();
    res.json({ success: true, data: channels });
  } catch (err) { next(err); }
});

channelsRouter.post('/dispatch',
  body('channel').isString().notEmpty(),
  body('customerId').isString().notEmpty(),
  body('content').isString().notEmpty(),
  body('variables').optional().isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { channel, customerId, content, variables } = req.body as {
        channel: string;
        customerId: string;
        content: string;
        variables?: Record<string, string>;
      };

      const result = await dispatch({ channel, customerId, content, variables });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
);

channelsRouter.post('/feedback',
  body('messageId').isString().notEmpty(),
  body('status').isString().notEmpty(),
  body('error').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { messageId, status, error } = req.body as {
        messageId: string;
        status: string;
        error?: string;
      };

      const result = await receiveFeedback({ messageId, status, error });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
);
