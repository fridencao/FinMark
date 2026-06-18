import dotenv from 'dotenv';
dotenv.config();

export const benefitConfig = {
  enabled: !!process.env.BENEFIT_BASE_URL,
  baseUrl: process.env.BENEFIT_BASE_URL || 'http://localhost:8081/api',
  apiKey: process.env.BENEFIT_API_KEY || '',
  timeout: Number(process.env.BENEFIT_TIMEOUT) || 5000,
};