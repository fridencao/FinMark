import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const scenarioRouter: RouterType = Router();

scenarioRouter.use(requireAuth);

scenarioRouter.get('/',
  query('category').optional().isString(),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { category, status, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (category) where.category = category;
      if (status) where.status = status;

      const [scenarios, total] = await Promise.all([
        prisma.scenario.findMany({
          where, skip: (Number(page) - 1) * Number(limit), take: Number(limit), orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, goal: true, category: true, icon: true, color: true, status: true, complianceScore: true, riskLevel: true, isCustom: true, createdAt: true, updatedAt: true, _count: { select: { executions: true } } },
        }),
        prisma.scenario.count({ where }),
      ]);

      res.json({ success: true, data: scenarios, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (err) { next(err); }
  }
);

scenarioRouter.get('/defaults', async (_req, res, next) => {
  try {
    const defaults = await prisma.scenario.findMany({ where: { isCustom: false }, orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: defaults });
  } catch (err) { next(err); }
});

scenarioRouter.get('/categories', (_req, res) => {
  res.json({ success: true, data: [
    { value: 'acquisition', label: '获客期' }, { value: 'growth', label: '成长期' },
    { value: 'mature', label: '成熟期' }, { value: 'declining', label: '衰退期' }, { value: 'recovery', label: '挽回期' },
  ]});
});

scenarioRouter.get('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      const scenario = await prisma.scenario.findUnique({ where: { id }, include: { executions: { orderBy: { createdAt: 'desc' }, take: 10 } } });
      if (!scenario) return next(new NotFoundError('Scenario'));
      res.json({ success: true, data: scenario });
    } catch (err) { next(err); }
  }
);

scenarioRouter.post('/',
  body('title').isString().notEmpty(),
  body('goal').isString().notEmpty(),
  body('category').isIn(['acquisition', 'growth', 'mature', 'declining', 'recovery']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const scenario = await prisma.scenario.create({
        data: { title: b.title as string, goal: b.goal as string, category: b.category as any, icon: b.icon as string | undefined, color: b.color as string | undefined, config: b.config as object | undefined, isCustom: true },
      });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'scenario', { scenarioId: scenario.id }, ip);
      res.status(201).json({ success: true, data: scenario });
    } catch (err) { next(err); }
  }
);

scenarioRouter.put('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const id = req.params?.id as string;
      const data: Record<string, unknown> = {};
      if (b.title) data.title = b.title;
      if (b.goal) data.goal = b.goal;
      if (b.category) data.category = b.category;
      if (b.config) data.config = b.config;
      if (b.status) data.status = b.status;
      if (b.icon !== undefined) data.icon = b.icon;
      if (b.color !== undefined) data.color = b.color;
      const scenario = await prisma.scenario.update({ where: { id }, data });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'UPDATE', 'scenario', { scenarioId: scenario.id }, ip);
      res.json({ success: true, data: scenario });
    } catch (err) { next(err); }
  }
);

scenarioRouter.delete('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      await prisma.scenario.delete({ where: { id } });
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'scenario', { scenarioId: id }, ip);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

scenarioRouter.post('/generate',
  body('description').isString().notEmpty(),
  body('language').optional().isIn(['zh', 'en']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const { description, language = 'zh' } = req.body as { description: string; language?: 'zh' | 'en' };
      
      // Call LLM Gateway to generate scenario configuration
      const llmGatewayUrl = process.env.LLM_GATEWAY_URL || 'http://localhost:3002';
      const apiKey = process.env.LLM_API_KEY || 'dummy-key';
      
      const prompt = language === 'zh' 
        ? `基于以下营销需求生成场景配置：
          ${description}
          
          请返回 JSON 格式：
          {
            "title": "场景名称 (20 字以内)",
            "goal": "详细的营销目标描述",
            "category": "获客期/成长期/成熟期/衰退期/挽回期 之一",
            "icon": "Users/Zap/TrendingUp/ShieldCheck/Sparkles 之一",
            "color": "blue/green/orange/red/purple 之一",
            "config": {
              "targetAudience": "目标客群描述",
              "channels": ["短信", "企微", "APP", "微信", "电话"],
              "content": "推荐的话术模板",
              "abTest": { "enabled": boolean, "variants": [] }
            }
          }`
        : `Generate scenario configuration based on the following marketing requirement:
          ${description}
          
          Return JSON format:
          {
            "title": "Scenario name (20 chars max)",
            "goal": "Detailed marketing goal description",
            "category": "acquisition/growth/mature/declining/recovery",
            "icon": "Users/Zap/TrendingUp/ShieldCheck/Sparkles",
            "color": "blue/green/orange/red/purple",
            "config": {
              "targetAudience": "Target audience description",
              "channels": ["SMS", "WeChat Work", "APP", "WeChat", "Call"],
              "content": "Recommended pitch template",
              "abTest": { "enabled": boolean, "variants": [] }
            }
          }`;
      
      const llmResponse = await fetch(`${llmGatewayUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          prompt: prompt,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      
      if (!llmResponse.ok) {
        console.error('[SCENARIO_GENERATE] LLM Gateway error:', llmResponse.status);
        // Fallback to basic generation
        return res.json({
          success: true,
          data: {
            title: `AI Generated: ${description.slice(0, 20)}...`,
            goal: description,
            category: 'growth',
            icon: 'Sparkles',
            color: 'blue',
            config: {
              targetAudience: language === 'zh' ? '基于描述自动识别目标客群' : 'Auto-detected from description',
              channels: ['短信', '企微', 'APP'],
              content: description,
              abTest: { enabled: false, variants: [] },
            },
          },
        });
      }
      
      const llmData = await llmResponse.json() as Record<string, any>;
      const generatedConfig = JSON.parse(llmData.data?.content || llmData.content || '{}');
      
      // Merge AI generated config with fallback
      const scenario = {
        title: generatedConfig.title || `AI Generated: ${description.slice(0, 20)}...`,
        goal: generatedConfig.goal || description,
        category: generatedConfig.category || 'growth',
        icon: generatedConfig.icon || 'Sparkles',
        color: generatedConfig.color || 'blue',
        config: generatedConfig.config || {
          targetAudience: language === 'zh' ? '基于描述自动识别目标客群' : 'Auto-detected from description',
          channels: ['短信', '企微', 'APP'],
          content: description,
          abTest: { enabled: false, variants: [] },
        },
      };
      
      res.json({ success: true, data: scenario });
    } catch (err) {
      console.error('[SCENARIO_GENERATE] Error:', err);
      // Fallback to basic generation
      const { description } = req.body as { description: string };
      res.json({
        success: true,
        data: {
          title: `AI Generated: ${description.slice(0, 20)}...`,
          goal: description,
          category: 'growth',
          icon: 'Sparkles',
          color: 'blue',
          config: {},
        },
      });
    }
  }
);

scenarioRouter.post('/:id/execute',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const id = req.params?.id as string;
      const scenario = await prisma.scenario.findUnique({ where: { id } });
      if (!scenario) return next(new NotFoundError('Scenario'));
      
      // Create execution record
      const execution = await prisma.execution.create({
        data: {
          scenarioId: scenario.id,
          status: 'pending',
          config: req.body,
        },
      });
      
      // Send to message queue for async execution
      const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
      const queueUrl = `${REDIS_URL}/queue/scenario-execution`;
      
      try {
        // Use BullMQ to add job to execution queue
        const { Queue } = await import('bullmq');
        const executionQueue = new Queue('scenario-execution', {
          connection: { url: REDIS_URL },
        });
        
        await executionQueue.add('execute-scenario', {
          executionId: execution.id,
          scenarioId: scenario.id,
          config: req.body,
        });
        
        await executionQueue.close();
        
        console.log(`[EXECUTION] Scenario ${id} queued for async execution (job: ${execution.id})`);
      } catch (queueError) {
        // Queue not available, log warning but continue
        console.warn('[EXECUTION] Message queue unavailable, execution may be delayed:', queueError);
      }
      
      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'EXECUTE', 'scenario', { scenarioId: scenario.id, executionId: execution.id }, ip);
      res.status(201).json({ success: true, data: execution });
    } catch (err) { next(err); }
  }
);
