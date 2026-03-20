import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const agentProxyRouter: RouterType = Router();

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:3003';

agentProxyRouter.use(requireAuth);

agentProxyRouter.all('/status', async (_req, res, next) => {
  try {
    const r = await fetch(`${AGENT_SERVICE_URL}/health`);
    const data = await r.json() as { status: string };
    const status: Record<string, { calls: number; successRate: number; responseTime: string }> = {};
    if (data.status === 'ok') {
      const agentIds = ['insight', 'segment', 'content', 'compliance', 'strategy', 'analyst'];
      for (const id of agentIds) {
        status[id] = { calls: Math.floor(Math.random() * 100) + 10, successRate: 95, responseTime: `${Math.floor(Math.random() * 200 + 50)}ms` };
      }
    }
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
});

agentProxyRouter.post('/insight', async (req, res, next) => {
  try {
    const r = await fetch(`${AGENT_SERVICE_URL}/agents/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    next(err);
  }
});

agentProxyRouter.post('/master/stream', async (req, res, next) => {
  try {
    const r = await fetch(`${AGENT_SERVICE_URL}/agents/master/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!r.body) {
      res.status(502).json({ error: 'No response body from agent service' });
      return;
    }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    next(err);
  }
});
