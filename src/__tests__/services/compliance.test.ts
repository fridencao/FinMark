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

import * as complianceService from '@/services/compliance';

describe('Compliance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getForbiddenWords', () => {
    it('should fetch forbidden words without params', async () => {
      const mockResponse = {
        data: [{ id: '1', word: 'test', category: 'spam', severity: 'high' }],
      };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await complianceService.getForbiddenWords();

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/compliance/forbidden-words',
        { params: undefined }
      );
    });

    it('should fetch forbidden words with params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { page: 1, pageSize: 20, category: 'spam', severity: 'high' };
      await complianceService.getForbiddenWords(params);

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/compliance/forbidden-words',
        { params }
      );
    });
  });

  describe('getForbiddenWord', () => {
    it('should fetch a single forbidden word by id', async () => {
      const mockResponse = { data: { id: '1', word: 'test' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await complianceService.getForbiddenWord('1');

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/compliance/forbidden-words/1'
      );
    });
  });

  describe('createForbiddenWord', () => {
    it('should create a new forbidden word', async () => {
      const mockResponse = { data: { id: '2', word: 'new word' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { word: 'new word', category: 'spam', severity: 'medium' as const };
      await complianceService.createForbiddenWord(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/compliance/forbidden-words',
        data
      );
    });
  });

  describe('updateForbiddenWord', () => {
    it('should update an existing forbidden word', async () => {
      const mockResponse = { data: { id: '1', word: 'updated' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { word: 'updated' };
      await complianceService.updateForbiddenWord('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith(
        '/compliance/forbidden-words/1',
        data
      );
    });
  });

  describe('deleteForbiddenWord', () => {
    it('should delete a forbidden word', async () => {
      (apiModule.default.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });

      await complianceService.deleteForbiddenWord('1');

      expect(apiModule.default.delete).toHaveBeenCalledWith(
        '/compliance/forbidden-words/1'
      );
    });
  });

  describe('toggleForbiddenWord', () => {
    it('should toggle forbidden word status', async () => {
      (apiModule.default.patch as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', status: 'inactive' },
      });

      await complianceService.toggleForbiddenWord('1', 'inactive');

      expect(apiModule.default.patch).toHaveBeenCalledWith(
        '/compliance/forbidden-words/1/status',
        { status: 'inactive' }
      );
    });
  });

  describe('getComplianceRules', () => {
    it('should fetch compliance rules with params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { page: 1, category: 'advertising', status: 'enabled' };
      await complianceService.getComplianceRules(params);

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/compliance/rules',
        { params }
      );
    });
  });

  describe('getComplianceRule', () => {
    it('should fetch a single compliance rule', async () => {
      const mockResponse = { data: { id: '1', name: 'Test Rule' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await complianceService.getComplianceRule('1');

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/compliance/rules/1'
      );
    });
  });

  describe('createComplianceRule', () => {
    it('should create a new compliance rule', async () => {
      const mockResponse = { data: { id: '2', name: 'New Rule' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'New Rule', category: 'advertising', pattern: '.*test.*' };
      await complianceService.createComplianceRule(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/compliance/rules',
        data
      );
    });
  });

  describe('updateComplianceRule', () => {
    it('should update an existing compliance rule', async () => {
      const mockResponse = { data: { id: '1', name: 'Updated Rule' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated Rule' };
      await complianceService.updateComplianceRule('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith(
        '/compliance/rules/1',
        data
      );
    });
  });

  describe('deleteComplianceRule', () => {
    it('should delete a compliance rule', async () => {
      (apiModule.default.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });

      await complianceService.deleteComplianceRule('1');

      expect(apiModule.default.delete).toHaveBeenCalledWith(
        '/compliance/rules/1'
      );
    });
  });

  describe('toggleComplianceRule', () => {
    it('should toggle compliance rule status', async () => {
      (apiModule.default.patch as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', status: 'disabled' },
      });

      await complianceService.toggleComplianceRule('1', 'disabled');

      expect(apiModule.default.patch).toHaveBeenCalledWith(
        '/compliance/rules/1/status',
        { status: 'disabled' }
      );
    });
  });

  describe('checkCompliance', () => {
    it('should check content compliance', async () => {
      const mockResponse = {
        data: {
          id: 'check-1',
          content: 'Test content',
          passed: false,
          violations: [{ ruleId: '1', ruleName: 'Spam', severity: 'high' }],
        },
      };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { content: 'Test content', source: 'user_input' };
      await complianceService.checkCompliance(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/compliance/check',
        data
      );
    });
  });

  describe('getComplianceLogs', () => {
    it('should fetch compliance logs with params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { page: 1, passed: false, startDate: '2024-01-01' };
      await complianceService.getComplianceLogs(params);

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/compliance/logs',
        { params }
      );
    });
  });
});
