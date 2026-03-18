import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { IntegrationAdapter } from './adapters/index.js';
import { IntegrationConfig } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

const config: IntegrationConfig = {
  crm: {
    enabled: process.env.CRM_ENABLED === 'true',
    provider: (process.env.CRM_PROVIDER as IntegrationConfig['crm']['provider']) || 'custom',
    apiUrl: process.env.CRM_API_URL || 'http://crm-system:8080',
    apiKey: process.env.CRM_API_KEY || '',
  },
  rights: {
    enabled: process.env.RIGHTS_ENABLED === 'true',
    provider: (process.env.RIGHTS_PROVIDER as IntegrationConfig['rights']['provider']) || 'custom',
    apiUrl: process.env.RIGHTS_API_URL || 'http://rights-system:8080',
    apiKey: process.env.RIGHTS_API_KEY || '',
  },
};

const integration = new IntegrationAdapter(config);

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const health = await integration.healthCheck();
  res.json({ 
    status: 'ok', 
    service: 'integration-service',
    integrations: health,
  });
});

app.get('/status', (req, res) => {
  res.json({
    crm: {
      enabled: integration.isCRMEnabled(),
      provider: config.crm.provider,
    },
    rights: {
      enabled: integration.isRightsEnabled(),
      provider: config.rights.provider,
    },
  });
});

app.get('/crm/contacts', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const limit = parseInt(req.query.limit as string) || 100;
  const contacts = await crm.getContacts(limit);
  res.json({ contacts });
});

app.get('/crm/contacts/:id', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const contact = await crm.getContact(req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  res.json(contact);
});

app.post('/crm/contacts', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const contact = await crm.createContact(req.body);
  if (!contact) {
    return res.status(500).json({ error: 'Failed to create contact' });
  }
  res.json(contact);
});

app.get('/crm/campaigns', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const campaigns = await crm.getCampaigns();
  res.json({ campaigns });
});

app.get('/crm/campaigns/:id', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const campaign = await crm.getCampaign(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
});

app.post('/crm/campaigns', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const campaign = await crm.createCampaign(req.body);
  if (!campaign) {
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
  res.json(campaign);
});

app.get('/crm/leads', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const limit = parseInt(req.query.limit as string) || 100;
  const leads = await crm.getLeads(limit);
  res.json({ leads });
});

app.get('/crm/leads/:id', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const lead = await crm.getLead(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
});

app.post('/crm/leads', async (req, res) => {
  if (!integration.isCRMEnabled()) {
    return res.status(503).json({ error: 'CRM integration not enabled' });
  }
  
  const crm = integration.getCRM();
  if (!crm) {
    return res.status(503).json({ error: 'CRM not configured' });
  }

  const lead = await crm.createLead(req.body);
  if (!lead) {
    return res.status(500).json({ error: 'Failed to create lead' });
  }
  res.json(lead);
});

app.post('/rights/check', async (req, res) => {
  if (!integration.isRightsEnabled()) {
    return res.status(503).json({ error: 'Rights integration not enabled' });
  }
  
  const rights = integration.getRights();
  if (!rights) {
    return res.status(503).json({ error: 'Rights not configured' });
  }

  const { userId, resource, action } = req.body;
  if (!userId || !resource || !action) {
    return res.status(400).json({ error: 'Missing required fields: userId, resource, action' });
  }

  const result = await rights.checkPermission(userId, resource, action);
  res.json(result);
});

app.get('/rights/users/:userId', async (req, res) => {
  if (!integration.isRightsEnabled()) {
    return res.status(503).json({ error: 'Rights integration not enabled' });
  }
  
  const rights = integration.getRights();
  if (!rights) {
    return res.status(503).json({ error: 'Rights not configured' });
  }

  const user = await rights.getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.get('/rights/users/:userId/roles', async (req, res) => {
  if (!integration.isRightsEnabled()) {
    return res.status(503).json({ error: 'Rights integration not enabled' });
  }
  
  const rights = integration.getRights();
  if (!rights) {
    return res.status(503).json({ error: 'Rights not configured' });
  }

  const roles = await rights.getUserRoles(req.params.userId);
  res.json({ roles });
});

app.get('/rights/users/:userId/permissions', async (req, res) => {
  if (!integration.isRightsEnabled()) {
    return res.status(503).json({ error: 'Rights integration not enabled' });
  }
  
  const rights = integration.getRights();
  if (!rights) {
    return res.status(503).json({ error: 'Rights not configured' });
  }

  const permissions = await rights.getUserPermissions(req.params.userId);
  res.json({ permissions });
});

app.get('/rights/roles', async (req, res) => {
  if (!integration.isRightsEnabled()) {
    return res.status(503).json({ error: 'Rights integration not enabled' });
  }
  
  const rights = integration.getRights();
  if (!rights) {
    return res.status(503).json({ error: 'Rights not configured' });
  }

  const roles = await rights.getRoles();
  res.json({ roles });
});

app.get('/rights/roles/:id', async (req, res) => {
  if (!integration.isRightsEnabled()) {
    return res.status(503).json({ error: 'Rights integration not enabled' });
  }
  
  const rights = integration.getRights();
  if (!rights) {
    return res.status(503).json({ error: 'Rights not configured' });
  }

  const role = await rights.getRole(req.params.id);
  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }
  res.json(role);
});

app.listen(PORT, () => {
  console.log(`Integration Service running on port ${PORT}`);
});

export default app;
