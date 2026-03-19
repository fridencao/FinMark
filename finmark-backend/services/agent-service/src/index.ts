import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import {
  MasterAgent, InsightAgent, SegmentAgent,
  ContentAgent, ComplianceAgent, StrategyAgent, AnalystAgent,
} from './agents/index.js';

const app: Application = express();
app.use(cors());
app.use(express.json());

const master = new MasterAgent();
const insight = new InsightAgent();
const segment = new SegmentAgent();
const content = new ContentAgent();
const compliance = new ComplianceAgent();
const strategy = new StrategyAgent();
const analyst = new AnalystAgent();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agent-service' });
});

app.post('/agents/insight', async (req, res, next) => {
  try {
    const { goal, context, lang = 'zh' } = req.body as { goal?: string; context?: string; lang?: string };
    if (!goal) return res.status(400).json({ error: 'goal is required' });
    insight.setLanguage(lang as 'zh' | 'en');
    const result = await insight.analyze(goal, context);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/agents/segment', async (req, res, next) => {
  try {
    const { insightResult, goal, lang = 'zh' } = req.body as { insightResult?: string; goal?: string; lang?: string };
    if (!insightResult || !goal) return res.status(400).json({ error: 'insightResult and goal are required' });
    segment.setLanguage(lang as 'zh' | 'en');
    const result = await segment.generate(insightResult, goal);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/agents/content', async (req, res, next) => {
  try {
    const { segmentResult, goal, channels, lang = 'zh' } = req.body as { segmentResult?: string; goal?: string; channels?: string[]; lang?: string };
    if (!segmentResult || !goal) return res.status(400).json({ error: 'segmentResult and goal are required' });
    content.setLanguage(lang as 'zh' | 'en');
    const result = await content.generate(segmentResult, goal, channels);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/agents/compliance', async (req, res, next) => {
  try {
    const { content: contentText, riskLevels, lang = 'zh' } = req.body as { content?: string; riskLevels?: string; lang?: string };
    if (!contentText) return res.status(400).json({ error: 'content is required' });
    compliance.setLanguage(lang as 'zh' | 'en');
    const result = await compliance.review(contentText, riskLevels);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/agents/strategy', async (req, res, next) => {
  try {
    const { complianceResult, budget, channels, lang = 'zh' } = req.body as { complianceResult?: string; budget?: number; channels?: string[]; lang?: string };
    if (!complianceResult) return res.status(400).json({ error: 'complianceResult is required' });
    strategy.setLanguage(lang as 'zh' | 'en');
    const result = await strategy.plan(complianceResult, budget || 10000, channels);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/agents/analyst', async (req, res, next) => {
  try {
    const { strategyResult, executionData, lang = 'zh' } = req.body as { strategyResult?: string; executionData?: string; lang?: string };
    if (!strategyResult) return res.status(400).json({ error: 'strategyResult is required' });
    analyst.setLanguage(lang as 'zh' | 'en');
    const result = await analyst.evaluate(strategyResult, executionData);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/agents/master', async (req, res, next) => {
  try {
    const { goal, budget, channels, lang = 'zh' } = req.body as { goal?: string; budget?: number; channels?: string[]; lang?: string };
    if (!goal) return res.status(400).json({ error: 'goal is required' });
    const result = await master.orchestrate({ goal, budget, channels, lang: lang as 'zh' | 'en' });
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/agents/master/stream', async (req, res, next) => {
  try {
    const { goal, budget, channels, lang = 'zh' } = req.body as { goal?: string; budget?: number; channels?: string[]; lang?: string };
    if (!goal) return res.status(400).json({ error: 'goal is required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    for await (const event of master.streamOrchestrate({ goal, budget, channels, lang: lang as 'zh' | 'en' })) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Agent Service] Stream error:', errMsg);
    if (!res.headersSent) {
      res.status(500).json({ error: errMsg });
    } else {
      res.write(`data: ${JSON.stringify({ agent: 'error', chunk: errMsg, done: true })}\n\n`);
      res.end();
    }
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[Agent Service Error]', msg);
  res.status(500).json({ success: false, error: msg });
});

const PORT = process.env.AGENT_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Agent Service running on http://localhost:${PORT}`);
});

export default app;
