import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3009;

app.use(cors());
app.use(express.json());

interface DashboardData {
  totalScenarios: number;
  activeScenarios: number;
  totalAtoms: number;
  activeUsers: number;
  apiCalls: number;
  successRate: number;
  avgResponseTime: number;
}

interface TrendData {
  date: string;
  scenarios: number;
  users: number;
  apiCalls: number;
}

interface ChartData {
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}

interface AlarmRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface AlarmHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  value: number;
  status: 'triggered' | 'resolved';
  triggeredAt: Date;
  resolvedAt?: Date;
}

const alarmRules: Map<string, AlarmRule> = new Map();
const alarmHistory: Map<string, AlarmHistory> = new Map();

const initializeDefaultData = () => {
  const rule1: AlarmRule = {
    id: 'rule-high-error',
    name: 'High Error Rate',
    metric: 'error_rate',
    condition: 'gt',
    threshold: 5,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  alarmRules.set(rule1.id, rule1);

  const rule2: AlarmRule = {
    id: 'rule-slow-response',
    name: 'Slow Response',
    metric: 'response_time',
    condition: 'gt',
    threshold: 2000,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  alarmRules.set(rule2.id, rule2);
};

initializeDefaultData();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'performance-service' });
});

app.get('/performance/dashboard', (req, res) => {
  const dashboard: DashboardData = {
    totalScenarios: 156,
    activeScenarios: 42,
    totalAtoms: 1234,
    activeUsers: 89,
    apiCalls: 45678,
    successRate: 99.2,
    avgResponseTime: 245,
  };
  res.json(dashboard);
});

app.get('/performance/trend', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const trends: TrendData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      scenarios: Math.floor(Math.random() * 20) + 10,
      users: Math.floor(Math.random() * 30) + 20,
      apiCalls: Math.floor(Math.random() * 1000) + 500,
    });
  }

  res.json({ trends });
});

app.get('/performance/charts', (req, res) => {
  const chartData: ChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      { label: 'API Calls', data: [1200, 1900, 3000, 5000, 2300, 1200, 1500] },
      { label: 'Errors', data: [12, 19, 30, 50, 23, 12, 15] },
    ],
  };
  res.json(chartData);
});

app.get('/performance/reports', (req, res) => {
  const reports = [
    { id: 'r1', name: 'Weekly Summary', type: 'weekly', createdAt: new Date() },
    { id: 'r2', name: 'Monthly Summary', type: 'monthly', createdAt: new Date() },
  ];
  res.json({ reports });
});

app.get('/performance/reports/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Sample Report',
    data: { summary: 'Report data here' },
    createdAt: new Date(),
  });
});

app.get('/performance/alarms', (req, res) => {
  const rules = Array.from(alarmRules.values());
  res.json({ rules, total: rules.length });
});

app.get('/performance/alarms/:id', (req, res) => {
  const rule = alarmRules.get(req.params.id);
  if (!rule) {
    return res.status(404).json({ message: 'Alarm rule not found' });
  }
  res.json(rule);
});

app.post('/performance/alarms', (req, res) => {
  const { name, metric, condition, threshold } = req.body;

  if (!name || !metric || !condition || !threshold) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const newRule: AlarmRule = {
    id: uuidv4(),
    name,
    metric,
    condition,
    threshold,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  alarmRules.set(newRule.id, newRule);
  res.status(201).json(newRule);
});

app.put('/performance/alarms/:id', (req, res) => {
  const rule = alarmRules.get(req.params.id);
  if (!rule) {
    return res.status(404).json({ message: 'Alarm rule not found' });
  }

  const updatedRule = { ...rule, ...req.body, updatedAt: new Date() };
  alarmRules.set(rule.id, updatedRule);
  res.json(updatedRule);
});

app.delete('/performance/alarms/:id', (req, res) => {
  if (!alarmRules.has(req.params.id)) {
    return res.status(404).json({ message: 'Alarm rule not found' });
  }
  alarmRules.delete(req.params.id);
  res.status(204).send();
});

app.patch('/performance/alarms/:id/status', (req, res) => {
  const rule = alarmRules.get(req.params.id);
  if (!rule) {
    return res.status(404).json({ message: 'Alarm rule not found' });
  }

  rule.status = req.body.status;
  rule.updatedAt = new Date();
  alarmRules.set(rule.id, rule);
  res.json(rule);
});

app.get('/performance/alarms/history', (req, res) => {
  const history = Array.from(alarmHistory.values());
  res.json({ history, total: history.length });
});

app.listen(PORT, () => {
  console.log(`Performance Service running on port ${PORT}`);
});

export default app;
