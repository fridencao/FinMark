import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { monitoringService } from '../services/monitoringService.js';

export const monitoringRouter: RouterType = Router();

monitoringRouter.use(requireAuth);

monitoringRouter.post('/calls', async (req, res, next) => {
  try {
    const { modelName, provider, promptTokens, completionTokens, totalTokens, responseTime, success, errorMessage, agentType } = req.body;

    if (!modelName || !provider || promptTokens == null || completionTokens == null || totalTokens == null || responseTime == null || success == null) {
      return res.status(400).json({ success: false, error: 'Missing required fields: modelName, provider, promptTokens, completionTokens, totalTokens, responseTime, success' });
    }

    const log = await monitoringService.logModelCall({
      modelName,
      provider,
      promptTokens: Number(promptTokens),
      completionTokens: Number(completionTokens),
      totalTokens: Number(totalTokens),
      responseTime: Number(responseTime),
      success: Boolean(success),
      errorMessage,
      agentType,
    });

    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
});

monitoringRouter.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate, modelName } = req.query as Record<string, string>;
    const filters: { startDate?: Date; endDate?: Date; modelName?: string } = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (modelName) filters.modelName = modelName;

    const stats = await monitoringService.getModelCallStats(filters);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

monitoringRouter.get('/stats/model/:modelName', async (req, res, next) => {
  try {
    const { modelName } = req.params;
    const { startDate, endDate } = req.query as Record<string, string>;
    const filters: { startDate?: Date; endDate?: Date; modelName: string } = { modelName };
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const [callStats, responseStats, usageStats] = await Promise.all([
      monitoringService.getModelCallStats(filters),
      monitoringService.getResponseTimeStats(filters),
      monitoringService.getUsageStats(filters),
    ]);

    res.json({
      success: true,
      data: {
        model: modelName,
        calls: callStats,
        responseTime: responseStats,
        usage: usageStats,
      },
    });
  } catch (err) { next(err); }
});

monitoringRouter.get('/stats/daily', async (req, res, next) => {
  try {
    const { startDate, endDate, modelName } = req.query as Record<string, string>;
    const filters: { startDate?: Date; endDate?: Date; modelName?: string } = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (modelName) filters.modelName = modelName;

    const daily = await monitoringService.getDailyStats(filters);
    res.json({ success: true, data: daily });
  } catch (err) { next(err); }
});

monitoringRouter.get('/errors', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const filters: { startDate?: Date; endDate?: Date } = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const errors = await monitoringService.getErrorStats(filters);
    res.json({ success: true, data: errors });
  } catch (err) { next(err); }
});

monitoringRouter.get('/response-times', async (req, res, next) => {
  try {
    const { startDate, endDate, modelName } = req.query as Record<string, string>;
    const filters: { startDate?: Date; endDate?: Date; modelName?: string } = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (modelName) filters.modelName = modelName;

    const stats = await monitoringService.getResponseTimeStats(filters);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

monitoringRouter.get('/usage', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const filters: { startDate?: Date; endDate?: Date } = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const stats = await monitoringService.getUsageStats(filters);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});
