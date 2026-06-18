import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiModule from '@/services/api';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import * as agentService from '@/services/agent';

describe('Agent Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callInsightAgent', () => {
    it('should call insight agent with target goal', async () => {
      const mockResponse = {
        data: { insightId: 'ins-1', segments: [] },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { targetGoal: 'Increase sales by 20%' };
      await agentService.callInsightAgent(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/insight',
        data
      );
    });

    it('should call insight agent with customer tags', async () => {
      const mockResponse = { data: { insightId: 'ins-1' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { targetGoal: 'Target young audience', customerTags: ['18-25', 'urban'] };
      await agentService.callInsightAgent(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/insight',
        data
      );
    });
  });

  describe('callSegmentAgent', () => {
    it('should call segment agent with insight id', async () => {
      const mockResponse = {
        data: { segments: [{ id: 'seg-1', name: 'Young Adults' }] },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { insightId: 'ins-1', maxCount: 5 };
      await agentService.callSegmentAgent(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/segment',
        data
      );
    });
  });

  describe('callContentAgent', () => {
    it('should call content agent with channels', async () => {
      const mockResponse = {
        data: { contentId: 'content-1', generated: true },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { segmentId: 'seg-1', channels: ['短信', '邮件'], tone: 'friendly' };
      await agentService.callContentAgent(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/content',
        data
      );
    });
  });

  describe('callComplianceAgent', () => {
    it('should call compliance agent for content review', async () => {
      const mockResponse = {
        data: { complianceId: 'comp-1', passed: true, violations: [] },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { contentId: 'content-1', customerRiskLevels: { high: 0.1 } };
      await agentService.callComplianceAgent(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/compliance',
        data
      );
    });
  });

  describe('callStrategyAgent', () => {
    it('should call strategy agent with budget and channels', async () => {
      const mockResponse = {
        data: { strategyId: 'strat-1', budget: 50000 },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { complianceId: 'comp-1', budget: 50000, channels: ['短信'] };
      await agentService.callStrategyAgent(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/strategy',
        data
      );
    });
  });

  describe('callEvaluationAgent', () => {
    it('should call evaluation agent with date range', async () => {
      const mockResponse = {
        data: { evaluationId: 'eval-1', metrics: {} },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = {
        strategyId: 'strat-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      await agentService.callEvaluationAgent(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/evaluation',
        data
      );
    });
  });

  describe('runMasterAgent', () => {
    it('should run master agent with goal', async () => {
      const mockResponse = { data: { runId: 'run-1', status: 'started' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await agentService.runMasterAgent('Create a marketing campaign');

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/master',
        { goal: 'Create a marketing campaign', context: undefined }
      );
    });

    it('should run master agent with context', async () => {
      const mockResponse = { data: { runId: 'run-1' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const context = { currentStep: 1, totalSteps: 5 };
      await agentService.runMasterAgent('Continue campaign', context);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/master',
        { goal: 'Continue campaign', context }
      );
    });
  });

  describe('streamAgent', () => {
    it('should stream agent response', async () => {
      const mockResponse = { data: 'streamed content' };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await agentService.streamAgent('insight', 'Analyze market trends');

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/insight/stream',
        { goal: 'Analyze market trends', context: undefined },
        { responseType: 'stream' }
      );
    });
  });

  describe('chatWithCustomer', () => {
    it('should chat with customer', async () => {
      const mockResponse = {
        data: { message: 'Hello, how can I help?', intent: 'greeting' },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const history = [{ role: 'user', content: 'Hi' }];
      await agentService.chatWithCustomer('Hello', history);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/copilot/chat',
        { message: 'Hello', history, context: undefined }
      );
    });
  });

  describe('getAgentStatus', () => {
    it('should get agent status', async () => {
      const mockResponse = {
        data: { insight: 'idle', segment: 'idle', content: 'busy' },
      };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await agentService.getAgentStatus();

      expect(apiModule.default.get).toHaveBeenCalledWith('/agents/status');
    });
  });

  describe('getAgentConfigs', () => {
    it('should get all agent configs', async () => {
      const mockResponse = {
        data: [
          { id: '1', agentType: 'insight', name: 'Insight Agent', enabled: true },
        ],
      };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await agentService.getAgentConfigs();

      expect(apiModule.default.get).toHaveBeenCalledWith('/agents/configs');
    });
  });

  describe('getAgentConfig', () => {
    it('should get a single agent config', async () => {
      const mockResponse = {
        data: { id: '1', agentType: 'insight', name: 'Insight Agent' },
      };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await agentService.getAgentConfig('insight');

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/agents/configs/insight'
      );
    });
  });

  describe('updateAgentConfig', () => {
    it('should update agent config', async () => {
      const mockResponse = {
        data: { id: '1', name: 'Updated Insight Agent', temperature: 0.8 },
      };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated Insight Agent', temperature: 0.8 };
      await agentService.updateAgentConfig('insight', data);

      expect(apiModule.default.put).toHaveBeenCalledWith(
        '/agents/configs/insight',
        data
      );
    });
  });

  describe('toggleAgent', () => {
    it('should toggle agent enabled status', async () => {
      const mockResponse = { data: { id: '1', enabled: false } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await agentService.toggleAgent('insight');

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/agents/configs/insight/toggle'
      );
    });
  });
});
