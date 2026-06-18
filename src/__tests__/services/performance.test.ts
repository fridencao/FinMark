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

import * as performanceService from '@/services/performance';

describe('Performance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should fetch dashboard metrics without params', async () => {
      const mockResponse = {
        data: {
          reach: 10000,
          reachRate: 0.5,
          response: 500,
          conversion: 50,
        },
      };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.getDashboardMetrics();

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/dashboard',
        { params: undefined }
      );
    });

    it('should fetch dashboard metrics with timeRange param', async () => {
      const mockResponse = { data: {} };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.getDashboardMetrics({ timeRange: '7d' });

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/dashboard',
        { params: { timeRange: '7d' } }
      );
    });
  });

  describe('getDashboardTrend', () => {
    it('should fetch dashboard trend', async () => {
      const mockResponse = { data: [{ date: '2024-01-01', reach: 1000 }] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.getDashboardTrend({ timeRange: '30d' });

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/trend',
        { params: { timeRange: '30d' } }
      );
    });
  });

  describe('getDashboardCharts', () => {
    it('should fetch dashboard charts with params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        chartType: 'channel' as const,
      };
      await performanceService.getDashboardCharts(params);

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/charts',
        { params }
      );
    });
  });

  describe('getActivityReports', () => {
    it('should fetch activity reports with pagination', async () => {
      const mockResponse = { data: [], total: 100 };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { page: 1, pageSize: 20 };
      await performanceService.getActivityReports(params);

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/reports',
        { params }
      );
    });

    it('should fetch activity reports with search', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.getActivityReports({ search: 'campaign' });

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/reports',
        { params: { search: 'campaign' } }
      );
    });
  });

  describe('getActivityReport', () => {
    it('should fetch a single activity report', async () => {
      const mockResponse = { data: { id: '1', name: 'Report 1' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.getActivityReport('1');

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/reports/1'
      );
    });
  });

  describe('exportReport', () => {
    it('should export report as excel', async () => {
      const mockResponse = { data: new Blob(['test']) };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.exportReport('1', 'excel');

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/reports/1/export',
        { params: { format: 'excel' }, responseType: 'blob' }
      );
    });

    it('should export report as pdf', async () => {
      const mockResponse = { data: new Blob(['test']) };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.exportReport('1', 'pdf');

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/reports/1/export',
        { params: { format: 'pdf' }, responseType: 'blob' }
      );
    });
  });

  describe('getAlarmRules', () => {
    it('should fetch all alarm rules', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Alarm 1' }] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.getAlarmRules();

      expect(apiModule.default.get).toHaveBeenCalledWith('/performance/alarms');
    });
  });

  describe('getAlarmRule', () => {
    it('should fetch a single alarm rule', async () => {
      const mockResponse = { data: { id: '1', name: 'Alarm 1' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await performanceService.getAlarmRule('1');

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/alarms/1'
      );
    });
  });

  describe('createAlarmRule', () => {
    it('should create a new alarm rule', async () => {
      const mockResponse = { data: { id: '2', name: 'New Alarm' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = {
        name: 'New Alarm',
        type: 'metric' as const,
        condition: { metric: 'reach', operator: 'lt', value: 100 },
        notify: { methods: ['email'], users: ['user1'] },
      };
      await performanceService.createAlarmRule(data);

      expect(apiModule.default.post).toHaveBeenCalledWith(
        '/performance/alarms',
        data
      );
    });
  });

  describe('updateAlarmRule', () => {
    it('should update an existing alarm rule', async () => {
      const mockResponse = { data: { id: '1', name: 'Updated Alarm' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated Alarm' };
      await performanceService.updateAlarmRule('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith(
        '/performance/alarms/1',
        data
      );
    });
  });

  describe('deleteAlarmRule', () => {
    it('should delete an alarm rule', async () => {
      (apiModule.default.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });

      await performanceService.deleteAlarmRule('1');

      expect(apiModule.default.delete).toHaveBeenCalledWith(
        '/performance/alarms/1'
      );
    });
  });

  describe('toggleAlarmRule', () => {
    it('should toggle alarm rule status', async () => {
      (apiModule.default.patch as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', status: 'disabled' },
      });

      await performanceService.toggleAlarmRule('1', 'disabled');

      expect(apiModule.default.patch).toHaveBeenCalledWith(
        '/performance/alarms/1/status',
        { status: 'disabled' }
      );
    });
  });

  describe('getAlarmHistory', () => {
    it('should fetch alarm history with params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { page: 1, ruleId: '1', startDate: '2024-01-01' };
      await performanceService.getAlarmHistory(params);

      expect(apiModule.default.get).toHaveBeenCalledWith(
        '/performance/alarms/history',
        { params }
      );
    });
  });
});
