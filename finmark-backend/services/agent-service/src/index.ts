import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MasterAgent, InsightAgent, SegmentAgent, ContentAgent, ComplianceAgent, StrategyAgent, AnalystAgent } from './agents/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const agents = {
  master: new MasterAgent(),
  insight: new InsightAgent(),
  segment: new SegmentAgent(),
  content: new ContentAgent(),
  compliance: new ComplianceAgent(),
  strategy: new StrategyAgent(),
  analyst: new AnalystAgent(),
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-service' });
});

app.get('/agents', (req, res) => {
  res.json({
    agents: Object.entries(agents).map(([key, agent]) => ({
      id: key,
      name: agent.getName(),
      description: agent.getDescription(),
    })),
  });
});

app.post('/agents/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { prompt, context } = req.body;
    
    const agent = agents[type];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const result = await agent.execute(prompt, context);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/agents/master/orchestrate', async (req, res) => {
  try {
    const { goal, context } = req.body;
    const agent = new MasterAgent();
    const result = await agent.orchestrate(goal, context);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/agents/stream/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { prompt, context } = req.body;
    
    const agent = agents[type];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of agent.stream(prompt, context)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Agent Service running on port ${PORT}`);
});

export default app;