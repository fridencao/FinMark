import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { prisma } from '../config/database.js';
import { generatePDF, generateExcel, type ReportConfig } from '../services/reportGenerator.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import { createReadStream } from 'fs';
import { join } from 'path';

export const reportRouter: RouterType = Router();

reportRouter.use(requireAuth);

// GET /api/reports - List all reports
reportRouter.get(
  '/',
  query('type').optional().isString(),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const { type, status, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (type) where.type = type;
      if (status) where.status = status;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.report.count({ where }),
      ]);

      res.json({
        success: true,
        data: reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/reports/:id - Get report details
reportRouter.get(
  '/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
      });

      if (!report) return next(new NotFoundError('Report'));

      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/reports/generate - Generate new report
reportRouter.post(
  '/generate',
  body('name').isString().notEmpty(),
  body('type').isIn(['summary', 'scenario', 'channel', 'customer']),
  body('format').isIn(['pdf', 'excel']),
  body('dateRange').isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const b = req.body as any;

      const report = await prisma.report.create({
        data: {
          name: b.name,
          type: b.type,
          format: b.format,
          status: 'pending',
          config: {
            type: b.type,
            dateRange: b.dateRange,
            filters: b.filters,
          },
        },
      });

      (async () => {
        try {
          const config: ReportConfig = {
            type: b.type,
            dateRange: b.dateRange,
            filters: b.filters,
          };

          const fileName =
            b.format === 'pdf' ? await generatePDF(config) : await generateExcel(config);

          await prisma.report.update({
            where: { id: report.id },
            data: {
              status: 'completed',
              fileId: fileName,
              generatedAt: new Date(),
            },
          });
        } catch (err) {
          await prisma.report.update({
            where: { id: report.id },
            data: { status: 'failed' },
          });
        }
      })();

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'GENERATE', 'report', { reportId: report.id }, ip);

      res.status(201).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/reports/:id/download - Download report file
reportRouter.get(
  '/:id/download',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
      });

      if (!report) return next(new NotFoundError('Report'));
      if (report.status !== 'completed' || !report.fileId) {
        return res.status(400).json({ success: false, error: 'Report not ready' });
      }

      const filePath = join(process.cwd(), 'reports', report.fileId);
      res.download(filePath, report.fileId);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/reports/:id - Delete report
reportRouter.delete(
  '/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));

      await prisma.report.delete({
        where: { id: req.params.id },
      });

      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'report', { reportId: req.params.id }, ip);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
