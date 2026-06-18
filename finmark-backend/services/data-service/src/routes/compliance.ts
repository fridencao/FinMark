import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import type { AuthRequest } from '../middleware/auth.js';

export const complianceRouter: RouterType = Router();

complianceRouter.use(requireAuth);

// ==================== 禁语词库 CRUD ====================

complianceRouter.get('/forbidden-words',
  query('category').optional().isString(),
  query('severity').optional().isString(),
  query('enabled').optional().isBoolean().toBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { category, severity, enabled, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (category) where.category = category;
      if (severity) where.severity = severity;
      if (enabled !== undefined) where.enabled = enabled;

      const [words, total] = await Promise.all([
        prisma.forbiddenWord.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.forbiddenWord.count({ where }),
      ]);

      res.json({
        success: true,
        data: words,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) { next(err); }
  }
);

complianceRouter.get('/forbidden-words/:id',
  param('id').isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const word = await prisma.forbiddenWord.findUnique({ where: { id: req.params!.id } });
      if (!word) throw new NotFoundError('Forbidden word not found');

      res.json({ success: true, data: word });
    } catch (err) { next(err); }
  }
);

complianceRouter.post('/forbidden-words',
  body('word').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('severity').isIn(['low', 'medium', 'high', 'critical']),
  body('replacement').isString().notEmpty(),
  body('enabled').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { word, category, severity, replacement, enabled = true } = req.body;
      const userId = (req as AuthRequest).user?.userId;

      const created = await prisma.forbiddenWord.create({
        data: {
          word,
          category,
          severity,
          replacement,
          enabled,
          createdBy: userId,
        },
      });

      res.status(201).json({ success: true, data: created });
    } catch (err) { next(err); }
  }
);

complianceRouter.put('/forbidden-words/:id',
  param('id').isString(),
  body('word').optional().isString(),
  body('category').optional().isString(),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('replacement').optional().isString(),
  body('enabled').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const existing = await prisma.forbiddenWord.findUnique({ where: { id: req.params!.id } });
      if (!existing) throw new NotFoundError('Forbidden word not found');

      const updated = await prisma.forbiddenWord.update({
        where: { id: req.params!.id },
        data: req.body,
      });

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  }
);

complianceRouter.delete('/forbidden-words/:id',
  param('id').isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const existing = await prisma.forbiddenWord.findUnique({ where: { id: req.params!.id } });
      if (!existing) throw new NotFoundError('Forbidden word not found');

      await prisma.forbiddenWord.delete({ where: { id: req.params!.id } });
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) { next(err); }
  }
);

// ==================== 合规规则 CRUD ====================

complianceRouter.get('/rules',
  query('type').optional().isString(),
  query('enabled').optional().isBoolean().toBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { type, enabled, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (type) where.type = type;
      if (enabled !== undefined) where.enabled = enabled;

      const [rules, total] = await Promise.all([
        prisma.complianceRule.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.complianceRule.count({ where }),
      ]);

      res.json({
        success: true,
        data: rules,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) { next(err); }
  }
);

complianceRouter.get('/rules/:id',
  param('id').isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const rule = await prisma.complianceRule.findUnique({ where: { id: req.params!.id } });
      if (!rule) throw new NotFoundError('Compliance rule not found');

      res.json({ success: true, data: rule });
    } catch (err) { next(err); }
  }
);

complianceRouter.post('/rules',
  body('name').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('type').isString().notEmpty(),
  body('config').isObject(),
  body('enabled').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { name, description, type, config, enabled = true } = req.body;
      const userId = (req as AuthRequest).user?.userId;

      const created = await prisma.complianceRule.create({
        data: {
          name,
          description,
          type,
          config,
          enabled,
          createdBy: userId,
        },
      });

      res.status(201).json({ success: true, data: created });
    } catch (err) { next(err); }
  }
);

complianceRouter.put('/rules/:id',
  param('id').isString(),
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('type').optional().isString(),
  body('config').optional().isObject(),
  body('enabled').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const existing = await prisma.complianceRule.findUnique({ where: { id: req.params!.id } });
      if (!existing) throw new NotFoundError('Compliance rule not found');

      const updated = await prisma.complianceRule.update({
        where: { id: req.params!.id },
        data: req.body,
      });

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  }
);

complianceRouter.delete('/rules/:id',
  param('id').isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const existing = await prisma.complianceRule.findUnique({ where: { id: req.params!.id } });
      if (!existing) throw new NotFoundError('Compliance rule not found');

      await prisma.complianceRule.delete({ where: { id: req.params!.id } });
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) { next(err); }
  }
);

// ==================== 合规检查 ====================

complianceRouter.post('/check',
  body('content').isString().notEmpty(),
  body('customerRiskLevel').optional().isString(),
  body('productRiskLevel').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { content, customerRiskLevel, productRiskLevel } = req.body;
      const userId = (req as AuthRequest).user?.userId;

      // Load forbidden words from DB
      const forbiddenWords = await prisma.forbiddenWord.findMany({ where: { enabled: true } });
      const rules = await prisma.complianceRule.findMany({ where: { enabled: true } });

      // Simple in-memory compliance check
      const matchedWords: Array<{
        word: string;
        category: string;
        severity: string;
        replacement: string;
        position: number;
      }> = [];
      const suggestions: string[] = [];

      for (const fw of forbiddenWords) {
        const regex = new RegExp(fw.word, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          matchedWords.push({
            word: fw.word,
            category: fw.category,
            severity: fw.severity,
            replacement: fw.replacement,
            position: match.index,
          });
          suggestions.push(`将 "${fw.word}" 替换为 "${fw.replacement}"`);
        }
      }

      // Check risk level rules
      const ruleViolations: Array<{
        ruleId: string;
        ruleName: string;
        description: string;
      }> = [];

      if (customerRiskLevel && productRiskLevel) {
        for (const rule of rules) {
          if (rule.type === 'risk_match') {
            const config = rule.config as { allowedMapping?: Record<string, string[]> };
            const allowed = config.allowedMapping?.[customerRiskLevel];
            if (allowed && !allowed.includes(productRiskLevel)) {
              ruleViolations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                description: rule.description,
              });
              suggestions.push(`风险等级不匹配: 客户 ${customerRiskLevel} 不适合购买 ${productRiskLevel} 级别产品`);
            }
          }
        }
      }

      // Calculate score
      const severityWeights: Record<string, number> = { low: 5, medium: 15, high: 30, critical: 50 };
      let deduction = 0;
      for (const m of matchedWords) {
        deduction += severityWeights[m.severity] || 10;
      }
      const score = Math.max(0, 100 - deduction);
      const passed = matchedWords.length === 0 && ruleViolations.length === 0;

      // Log the check
      await prisma.complianceCheckLog.create({
        data: {
          content,
          customerRisk: customerRiskLevel,
          productRisk: productRiskLevel,
          passed,
          score,
          forbiddenWords: matchedWords,
          ruleViolations,
          suggestions,
          checkedBy: userId,
        },
      });

      res.json({
        success: true,
        data: {
          passed,
          score,
          forbiddenWords: matchedWords,
          ruleViolations,
          suggestions,
        },
      });
    } catch (err) { next(err); }
  }
);

// ==================== 合规检查日志 ====================

complianceRouter.get('/logs',
  query('passed').optional().isBoolean().toBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { passed, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (passed !== undefined) where.passed = passed;

      const [logs, total] = await Promise.all([
        prisma.complianceCheckLog.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.complianceCheckLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) { next(err); }
  }
);
