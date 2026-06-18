import dotenv from 'dotenv';
dotenv.config();

export const channelConfig = {
  baseUrl: process.env.CHANNEL_BASE_URL || 'http://localhost:8080/api/channel',
  apiKey: process.env.CHANNEL_API_KEY || '',
  timeout: Number(process.env.CHANNEL_TIMEOUT) || 5000,
  enabled: !!process.env.CHANNEL_BASE_URL,
};
