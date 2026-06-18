import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing the service
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
}));

describe('channelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('healthCheck', () => {
    it('returns disconnected when CHANNEL_BASE_URL not set', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', '');
      const { healthCheck } = await import('../services/channelService.js');
      const result = await healthCheck();
      expect(result.status).toBe('disconnected');
      expect(result.reason).toBe('Not configured');
    });

    it('returns connected when health check succeeds', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', 'http://localhost:8080/api/channel');
      vi.stubEnv('CHANNEL_API_KEY', 'test-key');

      const mockGet = vi.fn().mockResolvedValue({ data: {} });
      vi.mocked(axios.create).mockReturnValue({
        get: mockGet,
        post: vi.fn(),
      } as any);

      const { healthCheck } = await import('../services/channelService.js');
      const result = await healthCheck();
      expect(result.status).toBe('connected');
    });

    it('returns error when health check fails', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', 'http://localhost:8080/api/channel');
      vi.stubEnv('CHANNEL_API_KEY', 'test-key');

      const mockGet = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.mocked(axios.create).mockReturnValue({
        get: mockGet,
        post: vi.fn(),
      } as any);

      const { healthCheck } = await import('../services/channelService.js');
      const result = await healthCheck();
      expect(result.status).toBe('error');
      expect(result.reason).toBe('Connection refused');
    });
  });

  describe('listChannels', () => {
    it('returns hardcoded list when client is null', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', '');
      const { listChannels } = await import('../services/channelService.js');
      const result = await listChannels();
      expect(result).toEqual([
        { id: 'wecom', name: '企业微信', type: 'wecom' },
        { id: 'sms', name: '短信', type: 'sms' },
        { id: 'email', name: '邮件', type: 'email' },
        { id: 'phone', name: '电话', type: 'phone' },
      ]);
    });

    it('returns channels from API when client is enabled', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', 'http://localhost:8080/api/channel');
      vi.stubEnv('CHANNEL_API_KEY', 'test-key');

      const mockGet = vi.fn().mockResolvedValue({
        data: { channels: [{ id: 'wecom', name: '企业微信', type: 'wecom' }] },
      });
      vi.mocked(axios.create).mockReturnValue({
        get: mockGet,
        post: vi.fn(),
      } as any);

      const { listChannels } = await import('../services/channelService.js');
      const result = await listChannels();
      expect(result).toEqual([{ id: 'wecom', name: '企业微信', type: 'wecom' }]);
    });

    it('returns empty array when API call fails', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', 'http://localhost:8080/api/channel');
      vi.stubEnv('CHANNEL_API_KEY', 'test-key');

      const mockGet = vi.fn().mockRejectedValue(new Error('API Error'));
      vi.mocked(axios.create).mockReturnValue({
        get: mockGet,
        post: vi.fn(),
      } as any);

      const { listChannels } = await import('../services/channelService.js');
      const result = await listChannels();
      expect(result).toEqual([]);
    });
  });

  describe('dispatch', () => {
    it('returns null when client is disabled', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', '');
      const { dispatch } = await import('../services/channelService.js');
      const result = await dispatch({
        channel: 'sms',
        customerId: 'cust-123',
        content: 'Hello',
      });
      expect(result).toBeNull();
    });

    it('calls POST /dispatch when client is enabled', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', 'http://localhost:8080/api/channel');
      vi.stubEnv('CHANNEL_API_KEY', 'test-key');

      const mockPost = vi.fn().mockResolvedValue({ data: { messageId: 'msg-123' } });
      vi.mocked(axios.create).mockReturnValue({
        get: vi.fn(),
        post: mockPost,
      } as any);

      const { dispatch } = await import('../services/channelService.js');
      const result = await dispatch({
        channel: 'sms',
        customerId: 'cust-123',
        content: 'Hello {{name}}',
        variables: { name: 'John' },
      });
      expect(mockPost).toHaveBeenCalledWith('/dispatch', {
        channel: 'sms',
        customerId: 'cust-123',
        content: 'Hello {{name}}',
        variables: { name: 'John' },
      });
      expect(result).toEqual({ messageId: 'msg-123' });
    });
  });

  describe('receiveFeedback', () => {
    it('returns success and logs feedback', async () => {
      vi.stubEnv('CHANNEL_BASE_URL', '');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { receiveFeedback } = await import('../services/channelService.js');
      const result = await receiveFeedback({
        messageId: 'msg-123',
        status: 'delivered',
      });
      expect(result).toEqual({ success: true });
      expect(consoleSpy).toHaveBeenCalledWith('[Channel Feedback]', {
        messageId: 'msg-123',
        status: 'delivered',
      });
      consoleSpy.mockRestore();
    });
  });
});
