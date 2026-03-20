import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import * as workflowService from '../services/workflowService.js';
import * as templateService from '../services/templateService.js';
import * as batchStrategyService from '../services/batchStrategyService.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Router as ExpressRouter } from 'express';

export const expertRouter: ExpressRouter = Router();

expertRouter.use(requireAuth);

// ===== Workflow Endpoints =====
expertRouter.get('/workflows', async (req, res, next) => {
  try {
    const { status } = req.query as Record<string, string>;
    const workflows = await workflowService.getAllWorkflows(status);
    res.json({ success: true, data: workflows });
  } catch (err) {
    next(err);
  }
});

expertRouter.get('/workflows/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));
    const workflow = await workflowService.getWorkflowById(req.params.id);
    if (!workflow) return next(new NotFoundError('Workflow'));
    res.json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
});

expertRouter.post('/workflows',
  body('name').isString().notEmpty(),
  body('nodes').isArray(),
  body('edges').isArray(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));
      const { name, description, nodes, edges } = req.body as any;
      const workflow = await workflowService.createWorkflow({ name, description, nodes, edges });
      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'workflow', { workflowId: workflow.id }, ip);
      res.status(201).json({ success: true, data: workflow });
    } catch (err) {
      next(err);
    }
  }
);

expertRouter.put('/workflows/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));
    const { name, description, nodes, edges, enabled, status } = req.body as any;
    const workflow = await workflowService.updateWorkflow(req.params.id, { name, description, nodes, edges, enabled, status });
    res.json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
});

expertRouter.delete('/workflows/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    await workflowService.deleteWorkflow(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

expertRouter.post('/workflows/:id/execute', param('id').isUUID(), async (req, res, next) => {
  try {
    const execution = await workflowService.executeWorkflow(req.params.id);
    res.status(201).json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
});

expertRouter.get('/workflows/executions/history', async (req, res, next) => {
  try {
    const { workflowId } = req.query as Record<string, string>;
    const executions = await workflowService.getExecutionHistory(workflowId);
    res.json({ success: true, data: executions });
  } catch (err) {
    next(err);
  }
});

// ===== Template Endpoints =====
expertRouter.get('/templates', async (req, res, next) => {
  try {
    const { type, category } = req.query as Record<string, string>;
    const templates = await templateService.getAllTemplates(type, category);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

expertRouter.get('/templates/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    if (!template) return next(new NotFoundError('Template'));
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

expertRouter.post('/templates',
  body('name').isString().notEmpty(),
  body('type').isString(),
  body('content').isString(),
  body('variables').isArray(),
  async (req, res, next) => {
    try {
      const { name, type, content, variables, category, description } = req.body as any;
      const template = await templateService.createTemplate({ name, type, content, variables, category, description });
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }
);

expertRouter.put('/templates/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body as any);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

expertRouter.delete('/templates/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

expertRouter.post('/templates/:id/render', param('id').isUUID(), async (req, res, next) => {
  try {
    const { variables } = req.body as { variables: Record<string, string> };
    const result = await templateService.renderTemplate(req.params.id, variables);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

expertRouter.post('/templates/:id/duplicate', param('id').isUUID(), async (req, res, next) => {
  try {
    const { newName } = req.body as { newName: string };
    const template = await templateService.duplicateTemplate(req.params.id, newName);
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

// ===== Batch Strategy Endpoints =====
expertRouter.get('/batch', async (req, res, next) => {
  try {
    const { status } = req.query as Record<string, string>;
    const batches = await batchStrategyService.getBatchStrategies(status);
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
});

expertRouter.post('/batch',
  body('name').isString().notEmpty(),
  body('operations').isArray(),
  body('targetIds').isArray(),
  async (req, res, next) => {
    try {
      const { name, description, operations, targetIds } = req.body as any;
      const batch = await batchStrategyService.createBatchStrategy({ name, description, operations, targetIds });
      res.status(201).json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  }
);

expertRouter.post('/batch/:id/execute', param('id').isUUID(), async (req, res, next) => {
  try {
    const result = await batchStrategyService.executeBatchStrategy(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

expertRouter.get('/batch/:id', param('id').isUUID(), async (req, res, next) => {
  try {
    const batch = await batchStrategyService.getBatchStatus(req.params.id);
    if (!batch) return next(new NotFoundError('BatchStrategy'));
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
});

expertRouter.post('/batch/:id/cancel', param('id').isUUID(), async (req, res, next) => {
  try {
    const batch = await batchStrategyService.cancelBatchStrategy(req.params.id);
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
});
