import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { llmGateway } from './services/llmGateway.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'llm-gateway' });
});

// POST /v1/completions - 非流式调用
app.post('/v1/completions', async (req, res) => {
  try {
    const { model, messages, temperature, maxTokens } = req.body;
    const result = await llmGateway.complete({
      model: model || 'gemini/gemini-1.5-pro',
      messages,
      temperature,
      maxTokens,
    });
    res.json(result);
  } catch (error: any) {
    console.error('LLM Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/chat/completions - OpenAI 兼容格式
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens, stream } = req.body;
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      for await (const chunk of llmGateway.stream({ model, messages, temperature, maxTokens: max_tokens })) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } } })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const result = await llmGateway.complete({
        model: model || 'gemini/gemini-1.5-pro',
        messages,
        temperature,
        maxTokens: max_tokens,
      });
      res.json({
        id: `chat-${Date.now()}`,
        model: model || 'gemini/gemini-1.5-pro',
        choices: [{ message: { role: 'assistant', content: result.content } }],
        usage: result.usage,
      });
    }
  } catch (error: any) {
    console.error('LLM Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/models - 获取可用模型
app.get('/v1/models', (req, res) => {
  res.json({
    data: llmGateway.getAvailableModels().map(model => ({
      id: model,
      object: 'model',
      created: Date.now(),
      owned_by: 'finmark',
    })),
  });
});

app.listen(PORT, () => {
  console.log(`LLM Gateway running on port ${PORT}`);
});

export default app;
