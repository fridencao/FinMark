import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
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
      (response) => response,
      async (error) => {
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
