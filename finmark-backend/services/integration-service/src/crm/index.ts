import axios, { AxiosInstance } from 'axios';
import { CRMContact, CRMCampaign, CRMLead } from '../types.js';

export interface CRMConfig {
  provider: 'salesforce' | 'hubspot' | 'custom';
  apiUrl: string;
  apiKey: string;
}

export class CRMIntegration {
  private client: AxiosInstance;
  private provider: string;

  constructor(config: CRMConfig) {
    this.provider = config.provider;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async getContacts(limit = 100): Promise<CRMContact[]> {
    try {
      const response = await this.client.get('/contacts', { params: { limit } });
      return response.data.map(this.normalizeContact.bind(this));
    } catch (error) {
      console.error('CRM getContacts error:', error);
      return [];
    }
  }

  async getContact(id: string): Promise<CRMContact | null> {
    try {
      const response = await this.client.get(`/contacts/${id}`);
      return this.normalizeContact(response.data);
    } catch (error) {
      console.error('CRM getContact error:', error);
      return null;
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact | null> {
    try {
      const response = await this.client.post('/contacts', this.denormalizeContact(contact));
      return this.normalizeContact(response.data);
    } catch (error) {
      console.error('CRM createContact error:', error);
      return null;
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact | null> {
    try {
      const response = await this.client.put(`/contacts/${id}`, this.denormalizeContact(contact));
      return this.normalizeContact(response.data);
    } catch (error) {
      console.error('CRM updateContact error:', error);
      return null;
    }
  }

  async getCampaigns(): Promise<CRMCampaign[]> {
    try {
      const response = await this.client.get('/campaigns');
      return response.data.map(this.normalizeCampaign.bind(this));
    } catch (error) {
      console.error('CRM getCampaigns error:', error);
      return [];
    }
  }

  async getCampaign(id: string): Promise<CRMCampaign | null> {
    try {
      const response = await this.client.get(`/campaigns/${id}`);
      return this.normalizeCampaign(response.data);
    } catch (error) {
      console.error('CRM getCampaign error:', error);
      return null;
    }
  }

  async createCampaign(campaign: Partial<CRMCampaign>): Promise<CRMCampaign | null> {
    try {
      const response = await this.client.post('/campaigns', this.denormalizeCampaign(campaign));
      return this.normalizeCampaign(response.data);
    } catch (error) {
      console.error('CRM createCampaign error:', error);
      return null;
    }
  }

  async getLeads(limit = 100): Promise<CRMLead[]> {
    try {
      const response = await this.client.get('/leads', { params: { limit } });
      return response.data.map(this.normalizeLead.bind(this));
    } catch (error) {
      console.error('CRM getLeads error:', error);
      return [];
    }
  }

  async getLead(id: string): Promise<CRMLead | null> {
    try {
      const response = await this.client.get(`/leads/${id}`);
      return this.normalizeLead(response.data);
    } catch (error) {
      console.error('CRM getLead error:', error);
      return null;
    }
  }

  async createLead(lead: Partial<CRMLead>): Promise<CRMLead | null> {
    try {
      const response = await this.client.post('/leads', this.denormalizeLead(lead));
      return this.normalizeLead(response.data);
    } catch (error) {
      console.error('CRM createLead error:', error);
      return null;
    }
  }

  async syncLeadToContact(leadId: string): Promise<boolean> {
    try {
      await this.client.post(`/leads/${leadId}/convert`);
      return true;
    } catch (error) {
      console.error('CRM syncLeadToContact error:', error);
      return false;
    }
  }

  private normalizeContact(data: Record<string, unknown>): CRMContact {
    return {
      id: data.id as string,
      name: data.name as string,
      email: data.email as string,
      phone: data.phone as string | undefined,
      company: data.company as string | undefined,
      segment: data.segment as string | undefined,
      tags: data.tags as string[] | undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
    };
  }

  private denormalizeContact(contact: Partial<CRMContact>): Record<string, unknown> {
    return {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      segment: contact.segment,
      tags: contact.tags,
    };
  }

  private normalizeCampaign(data: Record<string, unknown>): CRMCampaign {
    return {
      id: data.id as string,
      name: data.name as string,
      status: data.status as CRMCampaign['status'],
      targetAudience: data.targetAudience as string[] || [],
      content: data.content as string | undefined,
      metrics: data.metrics as CRMCampaign['metrics'],
    };
  }

  private denormalizeCampaign(campaign: Partial<CRMCampaign>): Record<string, unknown> {
    return {
      name: campaign.name,
      status: campaign.status,
      targetAudience: campaign.targetAudience,
      content: campaign.content,
    };
  }

  private normalizeLead(data: Record<string, unknown>): CRMLead {
    return {
      id: data.id as string,
      name: data.name as string,
      email: data.email as string,
      status: data.status as CRMLead['status'],
      source: data.source as string | undefined,
      assignedTo: data.assignedTo as string | undefined,
      score: data.score as number | undefined,
    };
  }

  private denormalizeLead(lead: Partial<CRMLead>): Record<string, unknown> {
    return {
      name: lead.name,
      email: lead.email,
      status: lead.status,
      source: lead.source,
      assignedTo: lead.assignedTo,
    };
  }
}
