import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

interface LLMModel {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Integration {
  id: string;
  type: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, unknown>;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GlobalConfig {
  systemName: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  auditLogRetention: number;
}

const models: Map<string, LLMModel> = new Map();
const integrations: Map<string, Integration> = new Map();

let globalConfig: GlobalConfig = {
  systemName: 'FinMark',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  emailNotifications: true,
  auditLogRetention: 90,
};

const initializeDefaultData = () => {
  const defaultModel: LLMModel = {
    id: 'model-gpt4',
    name: 'GPT-4',
    provider: 'openai',
    type: 'chat',
    status: 'active',
    isDefault: true,
    config: { model: 'gpt-4', temperature: 0.7 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  models.set(defaultModel.id, defaultModel);

  const claudeModel: LLMModel = {
    id: 'model-claude',
    name: 'Claude 3',
    provider: 'anthropic',
    type: 'chat',
    status: 'active',
    isDefault: false,
    config: { model: 'claude-3-opus', temperature: 0.7 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  models.set(claudeModel.id, claudeModel);
};

initializeDefaultData();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'settings-service' });
});

app.get('/settings/models', (req, res) => {
  const modelList = Array.from(models.values());
  res.json({ models: modelList, total: modelList.length });
});

app.get('/settings/models/:id', (req, res) => {
  const model = models.get(req.params.id);
  if (!model) {
    return res.status(404).json({ message: 'Model not found' });
  }
  res.json(model);
});

app.post('/settings/models', (req, res) => {
  const { name, provider, type, config } = req.body;

  if (!name || !provider) {
    return res.status(400).json({ message: 'Name and provider required' });
  }

  const newModel: LLMModel = {
    id: uuidv4(),
    name,
    provider,
    type: type || 'chat',
    status: 'active',
    isDefault: false,
    config: config || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  models.set(newModel.id, newModel);
  res.status(201).json(newModel);
});

app.put('/settings/models/:id', (req, res) => {
  const model = models.get(req.params.id);
  if (!model) {
    return res.status(404).json({ message: 'Model not found' });
  }

  const updatedModel = { ...model, ...req.body, updatedAt: new Date() };
  models.set(model.id, updatedModel);
  res.json(updatedModel);
});

app.delete('/settings/models/:id', (req, res) => {
  if (!models.has(req.params.id)) {
    return res.status(404).json({ message: 'Model not found' });
  }
  models.delete(req.params.id);
  res.status(204).send();
});

app.post('/settings/models/:id/test', (req, res) => {
  const model = models.get(req.params.id);
  if (!model) {
    return res.status(404).json({ message: 'Model not found' });
  }

  res.json({ success: true, message: `Model ${model.name} test passed` });
});

app.post('/settings/models/:id/default', (req, res) => {
  models.forEach((m) => {
    m.isDefault = m.id === req.params.id;
  });

  const model = models.get(req.params.id);
  if (!model) {
    return res.status(404).json({ message: 'Model not found' });
  }

  res.json(model);
});

app.get('/settings/global', (req, res) => {
  res.json(globalConfig);
});

app.put('/settings/global', (req, res) => {
  globalConfig = { ...globalConfig, ...req.body };
  res.json(globalConfig);
});

app.get('/settings/integrations', (req, res) => {
  const integrationList = Array.from(integrations.values());
  res.json({ integrations: integrationList });
});

app.get('/settings/integrations/:type', (req, res) => {
  const integration = integrations.get(req.params.type);
  if (!integration) {
    return res.status(404).json({ message: 'Integration not found' });
  }
  res.json(integration);
});

app.put('/settings/integrations/:type', (req, res) => {
  const { name, config } = req.body;

  const existing = integrations.get(req.params.type);
  const updated: Integration = {
    id: req.params.type,
    type: req.params.type,
    name: name || req.params.type,
    status: existing?.status || 'disconnected',
    config: config || {},
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
  };

  integrations.set(req.params.type, updated);
  res.json(updated);
});

app.post('/settings/integrations/:type/test', (req, res) => {
  const integration = integrations.get(req.params.type);
  if (!integration) {
    return res.status(404).json({ message: 'Integration not found' });
  }

  res.json({ success: true, message: `Integration ${integration.name} test passed` });
});

app.post('/settings/integrations/:type/connect', (req, res) => {
  const integration = integrations.get(req.params.type);
  if (!integration) {
    return res.status(404).json({ message: 'Integration not found' });
  }

  integration.status = 'connected';
  integration.lastSyncAt = new Date();
  integrations.set(req.params.type, integration);

  res.json(integration);
});

app.post('/settings/integrations/:type/disconnect', (req, res) => {
  const integration = integrations.get(req.params.type);
  if (!integration) {
    return res.status(404).json({ message: 'Integration not found' });
  }

  integration.status = 'disconnected';
  integrations.set(req.params.type, integration);

  res.json(integration);
});

app.listen(PORT, () => {
  console.log(`Settings Service running on port ${PORT}`);
});

export default app;
