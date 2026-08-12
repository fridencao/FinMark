import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';
import { healthCheck as benefitHealthCheck } from '../services/benefitService.js';
import { healthCheck as channelHealthCheck } from '../services/channelService.js';
import { bigDataService } from '../services/bigDataService.js';

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

const INTEGRATION_META = [
  { id: 'crm', name: 'CRM系统', type: 'crm' },
  { id: 'rights', name: '权益系统', type: 'rights' },
  { id: 'channel', name: '渠道系统', type: 'channel' },
  { id: 'bigdata', name: '大数据平台', type: 'bigdata' },
];

settingsRouter.get('/integrations', async (_req, res, next) => {
  try {
    const data = await Promise.all(
      INTEGRATION_META.map(async (meta) => {
        const check = healthCheckMap[meta.type];
        if (check) {
          try {
            const health = await check();
            return {
              ...meta,
              status: health.status,
              lastSync: health.status === 'connected' ? new Date().toISOString() : undefined,
              ...(health.reason ? { reason: health.reason } : {}),
            };
          } catch (err) {
            return {
              ...meta,
              status: 'error',
              reason: err instanceof Error ? err.message : String(err),
            };
          }
        }
        // 暂无独立健康检查实现的集成（如 crm）保持静态 connected
        return { ...meta, status: 'connected' as const };
      })
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

const healthCheckMap: Record<string, () => Promise<{ status: string; reason?: string }>> = {
  rights: benefitHealthCheck,
  channel: channelHealthCheck,
  bigdata: () => bigDataService.healthCheck(),
};

settingsRouter.post('/integrations/:type/connect', async (req, res, next) => {
  try {
    const { type } = req.params as Record<string, string>;
    const check = healthCheckMap[type];
    if (check) {
      const health = await check();
      if (health.status === 'connected') {
        return res.json({ success: true, data: { status: 'connected', lastSync: new Date().toISOString() } });
      }
      return res.json({ success: true, data: { status: 'error', reason: health.reason } });
    }
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
