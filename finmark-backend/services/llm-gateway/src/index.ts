import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import { generateContent, streamContent } from './geminiClient.js';
import { LLMRequestSchema } from './types.js';

const app: Application = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'llm-gateway', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
});

app.post('/v1/completions', async (req, res, next) => {
  try {
    const parsed = LLMRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { messages, temperature, maxTokens } = parsed.data;

    const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
    const userMessages = messages.filter(m => m.role !== 'system');
    const prompt = userMessages.map(m => `[${m.role}]: ${m.content}`).join('\n');
    const systemInstruction = systemParts.join('\n\n');

    const result = await generateContent(prompt, {
      systemInstruction,
      temperature,
      maxTokens,
    });

    res.json({
      id: `gen-${Date.now()}`,
      model: parsed.data.model,
      content: result.content,
      finishReason: 'stop',
      usage: result.usage,
    });
  } catch (err: unknown) {
    next(err);
  }
});

app.post('/v1/stream', async (req, res, next) => {
  try {
    const parsed = LLMRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { messages, temperature, maxTokens } = parsed.data;

    const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
    const userMessages = messages.filter(m => m.role !== 'system');
    const prompt = userMessages.map(m => `[${m.role}]: ${m.content}`).join('\n');
    const systemInstruction = systemParts.join('\n\n');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let totalContent = '';
    for await (const chunk of streamContent(prompt, { systemInstruction, temperature, maxTokens })) {
      totalContent += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true, content: totalContent })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[LLM Gateway] Stream error:', errMsg);
    if (!res.headersSent) {
      res.status(500).json({ error: errMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
    }
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[LLM Gateway Error]', msg);
  res.status(500).json({ error: msg });
});

const PORT = process.env.LLM_PORT || 3002;
app.listen(PORT, () => {
  console.log(`LLM Gateway running on http://localhost:${PORT}`);
});

export default app;
