import api from './api';

export interface ChannelInfo {
  id: string;
  name: string;
  type: string;
}

export interface DispatchPayload {
  channel: string;
  customerId: string;
  content: string;
  variables?: Record<string, string>;
}

export interface FeedbackPayload {
  messageId: string;
  status: string;
  error?: string;
}

export async function getChannels() {
  return api.get('/channels');
}

export async function dispatchChannel(payload: DispatchPayload) {
  return api.post('/channels/dispatch', payload);
}

export async function submitFeedback(payload: FeedbackPayload) {
  return api.post('/channels/feedback', payload);
}

export async function checkChannelHealth() {
  return api.get('/channels/health');
}
