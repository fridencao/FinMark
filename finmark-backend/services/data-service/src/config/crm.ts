import dotenv from 'dotenv';
dotenv.config();

export const crmConfig = {
  baseUrl: process.env.CRM_BASE_URL || 'http://localhost:8080/api',
  apiKey: process.env.CRM_API_KEY || '',
  timeout: Number(process.env.CRM_TIMEOUT) || 5000,
  retryAttempts: Number(process.env.CRM_RETRY_ATTEMPTS) || 3,
  cacheTTL: Number(process.env.CRM_CACHE_TTL) || 300,
};
