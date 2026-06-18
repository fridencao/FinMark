import axios, { AxiosInstance } from 'axios';
import { channelConfig } from '../config/channel.js';

interface ChannelClient {
  status: 'connected' | 'disconnected' | 'error';
  reason?: string;
}

interface ChannelInfo {
  id: string;
  name: string;
  type: string;
}

interface DispatchOptions {
  channel: string;
  customerId: string;
  content: string;
  variables?: Record<string, string>;
}

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance | null {
  if (!channelConfig.enabled) {
    return null;
  }
  if (!client) {
    client = axios.create({
      baseURL: channelConfig.baseUrl,
      timeout: channelConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': channelConfig.apiKey,
      },
    });
  }
  return client;
}

export async function healthCheck(): Promise<ChannelClient> {
  if (!channelConfig.enabled) {
    return { status: 'disconnected', reason: 'Not configured' };
  }
  try {
    const c = getClient()!;
    await c.get('/health');
    return { status: 'connected' };
  } catch (err: any) {
    return { status: 'error', reason: err.message };
  }
}

export async function listChannels(): Promise<ChannelInfo[]> {
  if (!channelConfig.enabled) {
    return [
      { id: 'wecom', name: '企业微信', type: 'wecom' },
      { id: 'sms', name: '短信', type: 'sms' },
      { id: 'email', name: '邮件', type: 'email' },
      { id: 'phone', name: '电话', type: 'phone' },
    ];
  }
  try {
    const c = getClient()!;
    const response = await c.get('/channels');
    return response.data.channels ?? response.data ?? [];
  } catch {
    return [];
  }
}

export async function dispatch(options: DispatchOptions): Promise<any> {
  if (!channelConfig.enabled) {
    return null;
  }
  const c = getClient()!;
  const response = await c.post('/dispatch', {
    channel: options.channel,
    customerId: options.customerId,
    content: options.content,
    variables: options.variables,
  });
  return response.data;
}

export async function receiveFeedback(params: {
  messageId: string;
  status: string;
  error?: string;
}): Promise<{ success: boolean }> {
  console.log('[Channel Feedback]', params);
  return { success: true };
}
