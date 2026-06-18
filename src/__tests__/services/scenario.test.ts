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

import * as scenarioService from '@/services/scenario';

describe('Scenario Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getScenarios', () => {
    it('should fetch scenarios without params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await scenarioService.getScenarios();

      expect(apiModule.default.get).toHaveBeenCalledWith('/scenarios', { params: undefined });
    });

    it('should fetch scenarios with params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { category: 'marketing', search: 'test', page: 1, pageSize: 10 };
      await scenarioService.getScenarios(params);

      expect(apiModule.default.get).toHaveBeenCalledWith('/scenarios', { params });
    });
  });

  describe('getScenario', () => {
    it('should fetch a single scenario', async () => {
      const mockResponse = { data: { id: '1', title: 'Test Scenario' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await scenarioService.getScenario('1');

      expect(apiModule.default.get).toHaveBeenCalledWith('/scenarios/1');
    });
  });

  describe('createScenario', () => {
    it('should create a new scenario', async () => {
      const mockResponse = { data: { id: '2', title: 'New Scenario' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { title: 'New Scenario', goal: 'Increase sales' };
      await scenarioService.createScenario(data);

      expect(apiModule.default.post).toHaveBeenCalledWith('/scenarios', data);
    });
  });

  describe('updateScenario', () => {
    it('should update an existing scenario', async () => {
      const mockResponse = { data: { id: '1', title: 'Updated Scenario' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { title: 'Updated Scenario' };
      await scenarioService.updateScenario('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith('/scenarios/1', data);
    });
  });

  describe('deleteScenario', () => {
    it('should delete a scenario', async () => {
      (apiModule.default.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });

      await scenarioService.deleteScenario('1');

      expect(apiModule.default.delete).toHaveBeenCalledWith('/scenarios/1');
    });
  });

  describe('generateScenarioByAI', () => {
    it('should generate scenario by AI', async () => {
      const mockResponse = {
        data: { id: '3', title: 'AI Generated', goal: 'Generated goal' },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await scenarioService.generateScenarioByAI('Create a marketing campaign for new product');

      expect(apiModule.default.post).toHaveBeenCalledWith('/scenarios/generate', {
        description: 'Create a marketing campaign for new product',
      });
    });
  });

  describe('executeScenario', () => {
    it('should execute a scenario', async () => {
      const mockResponse = { data: { executionId: 'exec-1', status: 'running' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await scenarioService.executeScenario('1', { param1: 'value' });

      expect(apiModule.default.post).toHaveBeenCalledWith('/scenarios/1/execute', { param1: 'value' });
    });
  });

  describe('getDefaultScenarios', () => {
    it('should fetch default scenarios', async () => {
      const mockResponse = { data: [{ id: 'default-1', title: 'Default' }] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await scenarioService.getDefaultScenarios();

      expect(apiModule.default.get).toHaveBeenCalledWith('/scenarios/defaults');
    });
  });

  describe('getScenarioCategories', () => {
    it('should fetch scenario categories', async () => {
      const mockResponse = { data: ['marketing', 'sales', 'support'] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await scenarioService.getScenarioCategories();

      expect(apiModule.default.get).toHaveBeenCalledWith('/scenarios/categories');
    });
  });
});
