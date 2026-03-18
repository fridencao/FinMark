import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

interface Scenario {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: string;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Atom {
  id: string;
  name: string;
  type: string;
  category: string;
  content: string;
  tags: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Array<{ name: string; traffic: number }>;
  metrics: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

interface Schedule {
  id: string;
  name: string;
  type: string;
  cron: string;
  status: 'active' | 'paused';
  config: Record<string, unknown>;
  nextRunAt: Date;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const scenarios: Map<string, Scenario> = new Map();
const atoms: Map<string, Atom> = new Map();
const abTests: Map<string, ABTest> = new Map();
const schedules: Map<string, Schedule> = new Map();

const initializeDefaultData = () => {
  const defaultScenario: Scenario = {
    id: 'scenario-1',
    name: 'New Customer Onboarding',
    description: 'Marketing campaign for new customer onboarding',
    category: 'marketing',
    status: 'active',
    type: 'marketing',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  scenarios.set(defaultScenario.id, defaultScenario);

  const defaultAtom: Atom = {
    id: 'atom-1',
    name: 'Welcome Email Template',
    type: 'template',
    category: 'email',
    content: 'Welcome to our platform...',
    tags: ['email', 'welcome'],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  atoms.set(defaultAtom.id, defaultAtom);

  const defaultABTest: ABTest = {
    id: 'abtest-1',
    name: 'Email Subject Test',
    description: 'Testing different email subject lines',
    status: 'running',
    variants: [
      { name: 'Control', traffic: 50 },
      { name: 'Variant A', traffic: 50 },
    ],
    metrics: { opens: 0, clicks: 0, conversions: 0 },
    startedAt: new Date(),
    createdAt: new Date(),
  };
  abTests.set(defaultABTest.id, defaultABTest);
};

initializeDefaultData();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'data-service' });
});

app.get('/api/data/strategies', (req, res) => {
  res.json([
    { id: 1, name: 'Growth Strategy', type: 'growth' },
    { id: 2, name: 'Risk Management', type: 'risk' },
  ]);
});

app.get('/scenarios', (req, res) => {
  const { category, status, search } = req.query;
  let result = Array.from(scenarios.values());

  if (category) {
    result = result.filter((s) => s.category === category);
  }
  if (status) {
    result = result.filter((s) => s.status === status);
  }
  if (search) {
    const searchLower = (search as string).toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
    );
  }

  res.json({ scenarios: result, total: result.length });
});

app.get('/scenarios/:id', (req, res) => {
  const scenario = scenarios.get(req.params.id);
  if (!scenario) {
    return res.status(404).json({ message: 'Scenario not found' });
  }
  res.json(scenario);
});

app.post('/scenarios', (req, res) => {
  const { name, description, category, type, config } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name required' });
  }

  const newScenario: Scenario = {
    id: uuidv4(),
    name,
    description: description || '',
    category: category || 'general',
    status: 'draft',
    type: type || 'general',
    config: config || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  scenarios.set(newScenario.id, newScenario);
  res.status(201).json(newScenario);
});

app.put('/scenarios/:id', (req, res) => {
  const scenario = scenarios.get(req.params.id);
  if (!scenario) {
    return res.status(404).json({ message: 'Scenario not found' });
  }

  const updated = { ...scenario, ...req.body, updatedAt: new Date() };
  scenarios.set(scenario.id, updated);
  res.json(updated);
});

app.delete('/scenarios/:id', (req, res) => {
  if (!scenarios.has(req.params.id)) {
    return res.status(404).json({ message: 'Scenario not found' });
  }
  scenarios.delete(req.params.id);
  res.status(204).send();
});

app.post('/scenarios/generate', (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ message: 'Description required' });
  }

  const newScenario: Scenario = {
    id: uuidv4(),
    name: `Generated: ${description.substring(0, 30)}...`,
    description,
    category: 'generated',
    status: 'draft',
    type: 'generated',
    config: { autoGenerated: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  scenarios.set(newScenario.id, newScenario);
  res.status(201).json(newScenario);
});

app.post('/scenarios/:id/execute', (req, res) => {
  const scenario = scenarios.get(req.params.id);
  if (!scenario) {
    return res.status(404).json({ message: 'Scenario not found' });
  }

  scenario.status = 'active';
  scenarios.set(scenario.id, scenario);

  res.json({ success: true, message: 'Scenario execution started', scenario });
});

app.get('/scenarios/defaults', (req, res) => {
  const defaults = [
    { id: 'default-1', name: 'Marketing Blast', category: 'marketing' },
    { id: 'default-2', name: 'Customer Retention', category: 'retention' },
    { id: 'default-3', name: 'Lead Nurturing', category: 'leads' },
  ];
  res.json({ scenarios: defaults });
});

app.get('/scenarios/categories', (req, res) => {
  const categories = ['marketing', 'retention', 'leads', 'engagement', 'general'];
  res.json({ categories });
});

app.get('/atoms', (req, res) => {
  const { type, category, search } = req.query;
  let result = Array.from(atoms.values());

  if (type) {
    result = result.filter((a) => a.type === type);
  }
  if (category) {
    result = result.filter((a) => a.category === category);
  }
  if (search) {
    const searchLower = (search as string).toLowerCase();
    result = result.filter(
      (a) =>
        a.name.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower)
    );
  }

  res.json({ atoms: result, total: result.length });
});

app.get('/atoms/:id', (req, res) => {
  const atom = atoms.get(req.params.id);
  if (!atom) {
    return res.status(404).json({ message: 'Atom not found' });
  }
  res.json(atom);
});

app.post('/atoms', (req, res) => {
  const { name, type, category, content, tags } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type required' });
  }

  const newAtom: Atom = {
    id: uuidv4(),
    name,
    type,
    category: category || 'general',
    content: content || '',
    tags: tags || [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  atoms.set(newAtom.id, newAtom);
  res.status(201).json(newAtom);
});

app.put('/atoms/:id', (req, res) => {
  const atom = atoms.get(req.params.id);
  if (!atom) {
    return res.status(404).json({ message: 'Atom not found' });
  }

  const updated = { ...atom, ...req.body, updatedAt: new Date() };
  atoms.set(atom.id, updated);
  res.json(updated);
});

app.delete('/atoms/:id', (req, res) => {
  if (!atoms.has(req.params.id)) {
    return res.status(404).json({ message: 'Atom not found' });
  }
  atoms.delete(req.params.id);
  res.status(204).send();
});

app.get('/abtests', (req, res) => {
  const { status } = req.query;
  let result = Array.from(abTests.values());

  if (status) {
    result = result.filter((t) => t.status === status);
  }

  res.json({ abtests: result, total: result.length });
});

app.get('/abtests/:id', (req, res) => {
  const test = abTests.get(req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'AB Test not found' });
  }
  res.json(test);
});

app.post('/abtests', (req, res) => {
  const { name, description, variants } = req.body;

  if (!name || !variants) {
    return res.status(400).json({ message: 'Name and variants required' });
  }

  const newTest: ABTest = {
    id: uuidv4(),
    name,
    description: description || '',
    status: 'draft',
    variants,
    metrics: { opens: 0, clicks: 0, conversions: 0 },
    createdAt: new Date(),
  };

  abTests.set(newTest.id, newTest);
  res.status(201).json(newTest);
});

app.put('/abtests/:id', (req, res) => {
  const test = abTests.get(req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'AB Test not found' });
  }

  const updated = { ...test, ...req.body };
  abTests.set(test.id, updated);
  res.json(updated);
});

app.post('/abtests/:id/start', (req, res) => {
  const test = abTests.get(req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'AB Test not found' });
  }

  test.status = 'running';
  test.startedAt = new Date();
  abTests.set(test.id, test);

  res.json(test);
});

app.post('/abtests/:id/stop', (req, res) => {
  const test = abTests.get(req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'AB Test not found' });
  }

  test.status = 'completed';
  test.completedAt = new Date();
  abTests.set(test.id, test);

  res.json(test);
});

app.get('/abtests/:id/result', (req, res) => {
  const test = abTests.get(req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'AB Test not found' });
  }

  res.json({
    id: test.id,
    name: test.name,
    status: test.status,
    variants: test.variants.map((v) => ({
      ...v,
      metrics: {
        opens: Math.floor(Math.random() * 1000),
        clicks: Math.floor(Math.random() * 500),
        conversions: Math.floor(Math.random() * 100),
      },
    })),
  });
});

app.get('/schedules', (req, res) => {
  const { status, type } = req.query;
  let result = Array.from(schedules.values());

  if (status) {
    result = result.filter((s) => s.status === status);
  }
  if (type) {
    result = result.filter((s) => s.type === type);
  }

  res.json({ schedules: result, total: result.length });
});

app.post('/schedules', (req, res) => {
  const { name, type, cron, config } = req.body;

  if (!name || !type || !cron) {
    return res.status(400).json({ message: 'Name, type, and cron required' });
  }

  const nextRun = new Date();
  nextRun.setHours(nextRun.getHours() + 1);

  const newSchedule: Schedule = {
    id: uuidv4(),
    name,
    type,
    cron,
    status: 'active',
    config: config || {},
    nextRunAt: nextRun,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  schedules.set(newSchedule.id, newSchedule);
  res.status(201).json(newSchedule);
});

app.post('/schedules/:id/pause', (req, res) => {
  const schedule = schedules.get(req.params.id);
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }

  schedule.status = 'paused';
  schedules.set(schedule.id, schedule);

  res.json(schedule);
});

app.post('/schedules/:id/resume', (req, res) => {
  const schedule = schedules.get(req.params.id);
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found' });
  }

  schedule.status = 'active';
  schedules.set(schedule.id, schedule);

  res.json(schedule);
});

app.listen(PORT, () => {
  console.log(`Data Service running on port ${PORT}`);
});

export default app;
