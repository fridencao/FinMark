import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';

export const settingsRouter: RouterType = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/models', async (_req, res, next) => {
  try {
    const models = await prisma.modelConfig.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: models });
  } catch (err) { next(err); }
});

settingsRouter.get('/models/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
    const id = req.params as Record<string, string>;
    const model = await prisma.modelConfig.findUnique({ where: { id: id.id } });
    if (!model) return res.status(404).json({ success: false, error: 'Model not found' });
    res.json({ success: true, data: model });
  } catch (err) { next(err); }
});

settingsRouter.post('/models',
  requireRole('admin'),
  body('name').isString().notEmpty(),
  body('provider').isString().notEmpty(),
  body('modelVersion').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const model = await prisma.modelConfig.create({
        data: {
          name: b.name as string,
          provider: b.provider as string,
          apiUrl: b.apiUrl as string | undefined,
          apiKey: b.apiKey as string || '',
          modelVersion: b.modelVersion as string,
          temperature: typeof b.temperature === 'number' ? b.temperature : 0.7,
          maxTokens: typeof b.maxTokens === 'number' ? b.maxTokens : 4096,
          status: (b.status as 'enabled' | 'disabled') || 'enabled',
          isDefault: false,
        },
      });
      res.status(201).json({ success: true, data: model });
    } catch (err) { next(err); }
  }
);

settingsRouter.put('/models/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      if (b.name !== undefined) data.name = b.name;
      if (b.provider !== undefined) data.provider = b.provider;
      if (b.apiUrl !== undefined) data.apiUrl = b.apiUrl;
      if (b.apiKey !== undefined) data.apiKey = b.apiKey;
      if (b.modelVersion !== undefined) data.modelVersion = b.modelVersion;
      if (b.temperature !== undefined) data.temperature = b.temperature;
      if (b.maxTokens !== undefined) data.maxTokens = b.maxTokens;
      if (b.status !== undefined) data.status = b.status;
      const p = req.params as Record<string, string>;
      const model = await prisma.modelConfig.update({ where: { id: p.id }, data });
      res.json({ success: true, data: model });
    } catch (err) { next(err); }
  }
);

settingsRouter.delete('/models/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const p = req.params as Record<string, string>;
      await prisma.modelConfig.delete({ where: { id: p.id } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

settingsRouter.post('/models/:id/test', param('id').isUUID(), async (_req, res, next) => {
  try {
    res.json({ success: true, data: { status: 'ok', latency: 120 } });
  } catch (err) { next(err); }
});

settingsRouter.post('/models/:id/default', param('id').isUUID(), async (req, res, next) => {
  try {
    const p = req.params as Record<string, string>;
    await prisma.modelConfig.updateMany({ data: { isDefault: false } });
    const model = await prisma.modelConfig.update({ where: { id: p.id }, data: { isDefault: true } });
    res.json({ success: true, data: model });
  } catch (err) { next(err); }
});

settingsRouter.get('/integrations', (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'crm', name: 'CRM系统', type: 'crm', status: 'connected', lastSync: new Date().toISOString() },
      { id: 'rights', name: '权益系统', type: 'rights', status: 'connected', lastSync: new Date().toISOString() },
      { id: 'channel', name: '渠道系统', type: 'channel', status: 'disconnected' },
      { id: 'bigdata', name: '大数据平台', type: 'bigdata', status: 'connected', lastSync: new Date().toISOString() },
    ],
  });
});

settingsRouter.post('/integrations/:type/connect', async (req, res, next) => {
  try {
    res.json({ success: true, data: { status: 'connected', lastSync: new Date().toISOString() } });
  } catch (err) { next(err); }
});

settingsRouter.post('/integrations/:type/disconnect', async (req, res, next) => {
  try {
    res.json({ success: true, data: { status: 'disconnected' } });
  } catch (err) { next(err); }
});

settingsRouter.get('/global', (_req, res) => {
  res.json({ success: true, data: { timezone: 'Asia/Shanghai', language: 'zh', theme: 'light' } });
});

settingsRouter.put('/global', async (req, res, next) => {
  try {
    res.json({ success: true, data: req.body });
  } catch (err) { next(err); }
});
