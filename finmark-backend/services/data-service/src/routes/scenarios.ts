import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import { validateFourStage, type FourStageScenario } from '../services/scenarioAI.js';

/**
 * 解析 LLM 网关返回的纯文本（可能是裸 JSON 或被 Markdown 代码块包裹），
 * 提取出首个 JSON 对象。解析失败返回 null，由调用方走 schema 校验失败路径。
 */
function parseScenarioJSON(raw: string): Record<string, any> | null {
  if (!raw) return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, any>;
  } catch {
    return null;
  }
}

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
    const { description, language = 'zh' } = req.body as { description: string; language?: 'zh' | 'en' };
    const fail = (errors: string[], fallback: boolean) => res.json({
      success: true,
      data: { valid: false, fallback, errors },
    });
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      // Call LLM Gateway to generate scenario configuration
      const llmGatewayUrl = process.env.LLM_GATEWAY_URL || 'http://localhost:3002';
      const apiKey = process.env.LLM_API_KEY || 'dummy-key';

      const systemPrompt = language === 'zh'
        ? '你是资深的金融营销场景设计专家。根据用户给出的营销需求，只返回一个严格合法的 JSON 对象（不要任何解释文字、不要 Markdown 代码块标记）。'
        : 'You are a senior financial marketing scenario designer. Based on the user requirement, return only a strict valid JSON object (no explanation, no Markdown code fences).';

      const prompt = language === 'zh'
        ? `基于以下营销需求生成场景的四段配置：
          ${description}

          必须返回严格合法的 JSON（无任何解释、无 Markdown 包裹）:
          {
            "title": "场景名称（20 字以内）",
            "goal": "详细营销目标描述",
            "category": "acquisition|growth|mature|declining|recovery 之一",
            "icon": "Users|Zap|TrendingUp|ShieldCheck|Sparkles 之一",
            "color": "blue|green|orange|red|purple 之一",
            "insightConfig": {
              "targetTags": ["客群标签1", "客群标签2"],
              "analysisLogic": "客户洞察的分析逻辑说明"
            },
            "segmentConfig": {
              "criteria": "客群圈选条件描述",
              "maxCount": 1000
            },
            "contentConfig": {
              "style": "内容风格（亲切/专业/紧迫/温暖 等）",
              "channels": ["短信", "企微", "APP", "微信", "电话"]
            },
            "strategyConfig": {
              "path": "策略执行路径描述（如：触发 → 渠道 → 转化跟踪）"
            }
          }`
        : `Generate a four-stage scenario configuration based on the following marketing requirement:
          ${description}

          Return only a strict valid JSON (no explanation, no Markdown fences):
          {
            "title": "Scenario name (20 chars max)",
            "goal": "Detailed marketing goal",
            "category": "acquisition|growth|mature|declining|recovery",
            "icon": "Users|Zap|TrendingUp|ShieldCheck|Sparkles",
            "color": "blue|green|orange|red|purple",
            "insightConfig": {
              "targetTags": ["tag1", "tag2"],
              "analysisLogic": "Insight analysis logic"
            },
            "segmentConfig": {
              "criteria": "Audience selection criteria",
              "maxCount": 1000
            },
            "contentConfig": {
              "style": "Content style (warm/professional/urgent/friendly)",
              "channels": ["SMS", "WeChat Work", "APP", "WeChat", "Call"]
            },
            "strategyConfig": {
              "path": "Strategy execution path (trigger → channel → conversion tracking)"
            }
          }`;

      const llmResponse = await fetch(`${llmGatewayUrl}/v1/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          maxTokens: 2000,
        }),
      });

      if (!llmResponse.ok) {
        console.error('[SCENARIO_GENERATE] LLM Gateway error:', llmResponse.status);
        return fail(
          [language === 'zh' ? `AI 网关返回 ${llmResponse.status}` : `AI gateway returned ${llmResponse.status}`],
          true,
        );
      }

      const llmData = await llmResponse.json() as { content?: string };
      const generatedConfig = parseScenarioJSON(llmData.content || '');

      if (!generatedConfig) {
        console.error('[SCENARIO_GENERATE] Failed to parse LLM response as JSON');
        return fail(
          [language === 'zh' ? 'AI 返回结果无法解析为 JSON' : 'AI response is not valid JSON'],
          false,
        );
      }

      const validated = validateFourStage(generatedConfig);
      if (!validated.valid) {
        console.error('[SCENARIO_GENERATE] LLM output failed schema validation:', validated.errors);
        return fail(validated.errors, false);
      }

      return res.json({
        success: true,
        data: { valid: true, scenario: validated.data satisfies FourStageScenario },
      });
    } catch (err) {
      console.error('[SCENARIO_GENERATE] Error:', err);
      return fail(
        [language === 'zh' ? 'AI 服务暂不可用，请手动配置' : 'AI service unavailable, please configure manually'],
        true,
      );
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
