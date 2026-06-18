import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    agentConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import * as agentConfigService from '../services/agentConfigService.js';
import { prisma } from '../config/database.js';

describe('agentConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllConfigs', () => {
    it('should return existing configs when all 6 agent types exist', async () => {
      const existingConfigs = [
        { id: '1', agentType: 'insight', name: '洞察智能体', prompt: 'prompt1', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', agentType: 'segment', name: '客群智能体', prompt: 'prompt2', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', agentType: 'content', name: '内容智能体', prompt: 'prompt3', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '4', agentType: 'compliance', name: '合规智能体', prompt: 'prompt4', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '5', agentType: 'strategy', name: '策略智能体', prompt: 'prompt5', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '6', agentType: 'analyst', name: '评估智能体', prompt: 'prompt6', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
      ];
      (prisma.agentConfig.findMany as any).mockResolvedValueOnce(existingConfigs);

      const result = await agentConfigService.getAllConfigs();

      expect(result).toEqual(existingConfigs);
      expect(prisma.agentConfig.createMany).not.toHaveBeenCalled();
    });

    it('should seed missing agent types when some are absent', async () => {
      (prisma.agentConfig.findMany as any).mockResolvedValueOnce([
        { id: '1', agentType: 'insight', name: '洞察智能体', prompt: 'p', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);
      (prisma.agentConfig.findMany as any).mockResolvedValueOnce([
        { id: '1', agentType: 'insight', name: '洞察智能体', prompt: 'p', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', agentType: 'segment', name: '客群智能体', prompt: '', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', agentType: 'content', name: '内容智能体', prompt: '', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '4', agentType: 'compliance', name: '合规智能体', prompt: '', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '5', agentType: 'strategy', name: '策略智能体', prompt: '', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '6', agentType: 'analyst', name: '评估智能体', prompt: '', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await agentConfigService.getAllConfigs();

      expect(prisma.agentConfig.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ agentType: 'segment' }),
          expect.objectContaining({ agentType: 'content' }),
          expect.objectContaining({ agentType: 'compliance' }),
          expect.objectContaining({ agentType: 'strategy' }),
          expect.objectContaining({ agentType: 'analyst' }),
        ]),
      });
      expect(result).toHaveLength(6);
    });
  });

  describe('getConfigByType', () => {
    it('should return existing config for known agent type', async () => {
      const mockConfig = { id: '1', agentType: 'insight', name: '洞察智能体', prompt: 'prompt', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() };
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(mockConfig);

      const result = await agentConfigService.getConfigByType('insight');

      expect(result).toEqual(mockConfig);
    });

    it('should lazy-create config for known agent type when not found', async () => {
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(null);
      (prisma.agentConfig.create as any).mockResolvedValueOnce({
        id: 'new-1',
        agentType: 'insight',
        name: '洞察智能体',
        prompt: expect.any(String),
        enabled: true,
        temperature: 0.7,
        maxTokens: 4096,
        modelId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await agentConfigService.getConfigByType('insight');

      expect(prisma.agentConfig.create).toHaveBeenCalledWith({
        data: {
          agentType: 'insight',
          name: '洞察智能体',
          prompt: expect.any(String),
        },
      });
      expect(result).toBeDefined();
      expect(result!.agentType).toBe('insight');
    });

    it('should return null for unknown agent type', async () => {
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(null);

      const result = await agentConfigService.getConfigByType('unknown');

      expect(result).toBeNull();
      expect(prisma.agentConfig.create).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update config fields', async () => {
      const mockConfig = { id: '1', agentType: 'insight', name: '洞察智能体', prompt: 'old', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() };
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(mockConfig);
      (prisma.agentConfig.update as any).mockResolvedValueOnce({ ...mockConfig, prompt: 'new prompt', temperature: 0.9 });

      const result = await agentConfigService.updateConfig('insight', { prompt: 'new prompt', temperature: 0.9 });

      expect(prisma.agentConfig.update).toHaveBeenCalledWith({
        where: { agentType: 'insight' },
        data: { prompt: 'new prompt', temperature: 0.9 },
      });
      expect(result.prompt).toBe('new prompt');
      expect(result.temperature).toBe(0.9);
    });

    it('should lazy-seed then update when config does not exist', async () => {
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(null);
      (prisma.agentConfig.create as any).mockResolvedValueOnce({
        id: 'new-1',
        agentType: 'insight',
        name: '洞察智能体',
        prompt: expect.any(String),
        enabled: true,
        temperature: 0.7,
        maxTokens: 4096,
        modelId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.agentConfig.update as any).mockResolvedValueOnce({
        id: 'new-1',
        agentType: 'insight',
        name: 'New Name',
        prompt: 'updated',
        enabled: true,
        temperature: 0.5,
        maxTokens: 8192,
        modelId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await agentConfigService.updateConfig('insight', { name: 'New Name', temperature: 0.5, maxTokens: 8192 });

      expect(prisma.agentConfig.create).toHaveBeenCalled();
      expect(prisma.agentConfig.update).toHaveBeenCalledWith({
        where: { agentType: 'insight' },
        data: { name: 'New Name', temperature: 0.5, maxTokens: 8192 },
      });
      expect(result.temperature).toBe(0.5);
    });
  });

  describe('toggleConfig', () => {
    it('should flip enabled flag from true to false', async () => {
      const mockConfig = { id: '1', agentType: 'insight', name: '洞察智能体', prompt: 'p', enabled: true, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() };
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(mockConfig);
      (prisma.agentConfig.update as any).mockResolvedValueOnce({ ...mockConfig, enabled: false });

      const result = await agentConfigService.toggleConfig('insight');

      expect(result.enabled).toBe(false);
      expect(prisma.agentConfig.update).toHaveBeenCalledWith({
        where: { agentType: 'insight' },
        data: { enabled: false },
      });
    });

    it('should flip enabled flag from false to true', async () => {
      const mockConfig = { id: '1', agentType: 'insight', name: '洞察智能体', prompt: 'p', enabled: false, temperature: 0.7, maxTokens: 4096, modelId: null, createdAt: new Date(), updatedAt: new Date() };
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(mockConfig);
      (prisma.agentConfig.update as any).mockResolvedValueOnce({ ...mockConfig, enabled: true });

      const result = await agentConfigService.toggleConfig('insight');

      expect(result.enabled).toBe(true);
    });

    it('should throw if config not found', async () => {
      (prisma.agentConfig.findUnique as any).mockResolvedValueOnce(null);

      await expect(agentConfigService.toggleConfig('unknown')).rejects.toThrow('Unknown agent type: unknown');
    });
  });
});
