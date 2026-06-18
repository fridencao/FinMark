import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { crmConfig } from '../config/crm.js';
import { prisma } from '../config/database.js';

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface CRMRetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

class CRMService {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: crmConfig.baseUrl,
      timeout: crmConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': crmConfig.apiKey,
      },
    });

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: { config?: InternalAxiosRequestConfig }) => {
        const config = error.config as CRMRetryConfig;
        if (!config || !config.retryCount) {
          return Promise.reject(error);
        }

        if (config.retryCount >= crmConfig.retryAttempts) {
          return Promise.reject(error);
        }

        config.retryCount += 1;
        const backoff = Math.pow(2, config.retryCount) * 1000;
        console.log(`Retrying CRM request (${config.retryCount}/${crmConfig.retryAttempts}) after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.client(config);
      }
    );
  }

  async getCustomer(customerId: string) {
    const cacheKey = `customer:${customerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/customers/${customerId}`);
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getCustomerAccounts(customerId: string) {
    const cacheKey = `accounts:${customerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/customers/${customerId}/accounts`);
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getCustomerTransactions(customerId: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await this.client.get(`/customers/${customerId}/transactions?${params}`);
    return response.data;
  }

  async searchCustomers(query: {
    name?: string;
    phone?: string;
    idNumber?: string;
    accountNumber?: string;
  }) {
    const params = new URLSearchParams();
    if (query.name) params.append('name', query.name);
    if (query.phone) params.append('phone', query.phone);
    if (query.idNumber) params.append('idNumber', query.idNumber);
    if (query.accountNumber) params.append('accountNumber', query.accountNumber);

    const response = await this.client.get(`/customers/search?${params}`);
    return response.data;
  }

  async syncCustomers(lastSyncDate?: Date) {
    const params = lastSyncDate ? `?since=${lastSyncDate.toISOString()}` : '';
    const response = await this.client.get(`/customers/sync${params}`);
    
    await prisma.crmCustomerSync.createMany({
      data: response.data.customers.map((c: any) => ({
        crmId: c.id,
        name: c.name,
        phone: c.phone,
        idNumber: c.idNumber,
        lastSyncAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return response.data;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > crmConfig.cacheTTL * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const crmService = new CRMService();

export interface MappedCustomer {
  crmId: string;
  name: string;
  phone: string | null;
  idNumber: string | null;
  tags: string[];
  riskLevel: string | null;
}

const DEFAULT_FIELD_MAP: Record<string, keyof MappedCustomer> = {
  id: 'crmId',
  name: 'name',
  full_name: 'name',
  phone: 'phone',
  mobile_phone: 'phone',
  idNumber: 'idNumber',
  id_card: 'idNumber',
  tags: 'tags',
  custom_tags: 'tags',
  riskLevel: 'riskLevel',
  risk_level: 'riskLevel',
};

export class CrmIntegrationService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: crmConfig.baseUrl,
      timeout: crmConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': crmConfig.apiKey,
      },
    });
  }

  mapCustomerData(
    crmData: Record<string, any>,
    fieldMap?: Record<string, string>
  ): MappedCustomer {
    const map = fieldMap
      ? Object.fromEntries(Object.entries(fieldMap).map(([k, v]) => [k, v as keyof MappedCustomer]))
      : DEFAULT_FIELD_MAP;

    const result: MappedCustomer = {
      crmId: '',
      name: '',
      phone: null,
      idNumber: null,
      tags: [],
      riskLevel: null,
    };

    for (const [crmField, internalField] of Object.entries(map)) {
      if (crmField in crmData) {
        const value = crmData[crmField];
        if (internalField === 'tags') {
          result.tags = Array.isArray(value) ? value : [];
        } else {
          (result as any)[internalField] = value ?? null;
        }
      }
    }

    return result;
  }

  async syncCustomers(lastSyncDate?: Date): Promise<{
    synced: number;
    customers: MappedCustomer[];
  }> {
    const params = lastSyncDate ? `?since=${lastSyncDate.toISOString()}` : '';
    const response = await this.client.get(`/customers/sync${params}`);

    const customers: MappedCustomer[] = response.data.customers.map((c: any) =>
      this.mapCustomerData(c)
    );

    await prisma.crmCustomerSync.createMany({
      data: customers.map((c) => ({
        crmId: c.crmId,
        name: c.name,
        phone: c.phone,
        idNumber: c.idNumber,
        lastSyncAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return { synced: customers.length, customers };
  }

  async getCustomerTags(customerId: string): Promise<string[]> {
    const response = await this.client.get(`/customers/${customerId}/tags`);
    return response.data.tags ?? [];
  }

  async exportAudienceSegment(
    segmentId: string,
    crmSegmentName: string
  ): Promise<{ exportId: string; count: number }> {
    const segment = await prisma.audienceSegment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new Error('Audience segment not found');
    }

    const where = await buildExportQuery(segment.conditions as any[]);
    const customers = await prisma.customer.findMany({ where });

    const response = await this.client.post(
      `/segments/${crmSegmentName}/customers`,
      {
        segmentName: segment.name,
        customers: customers.map((c) => ({
          crmId: c.id,
          name: c.name,
          segment: c.segment,
          asset: c.asset,
          tags: c.tags,
        })),
      }
    );

    return {
      exportId: response.data.exportId,
      count: response.data.count ?? customers.length,
    };
  }
}

async function buildExportQuery(conditions: any[]): Promise<any> {
  const where: any = {};

  for (const condition of conditions) {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'eq':
        where[field] = value;
        break;
      case 'ne':
        where[field] = { not: value };
        break;
      case 'gt':
        where[field] = { gt: value };
        break;
      case 'gte':
        where[field] = { gte: value };
        break;
      case 'lt':
        where[field] = { lt: value };
        break;
      case 'lte':
        where[field] = { lte: value };
        break;
      case 'in':
        where[field] = { in: value };
        break;
      case 'contains':
        where[field] = { contains: value };
        break;
    }
  }

  return where;
}
