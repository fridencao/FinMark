import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('../config/database.js', () => ({
  prisma: {
    crmCustomerSync: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({}),
    },
    customer: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    audienceSegment: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('../config/crm.js', () => ({
  crmConfig: {
    baseUrl: 'http://mock-crm.test/api',
    apiKey: 'test-key',
    timeout: 5000,
    retryAttempts: 3,
    cacheTTL: 300,
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      interceptors: {
        response: { use: vi.fn() },
      },
    })),
  },
}));

import { CrmIntegrationService } from '../services/crmService.js';
import { prisma } from '../config/database.js';

describe('CrmIntegrationService', () => {
  let service: CrmIntegrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmIntegrationService();
  });

  describe('mapCustomerData', () => {
    it('should map CRM fields to internal format', () => {
      const crmData = {
        id: 'CRM-001',
        full_name: '张三',
        mobile_phone: '13800138000',
        id_card: '110101199001011234',
        custom_tags: ['VIP', '高净值'],
        risk_level: 'R3',
      };

      const mapped = service.mapCustomerData(crmData);

      expect(mapped).toEqual({
        crmId: 'CRM-001',
        name: '张三',
        phone: '13800138000',
        idNumber: '110101199001011234',
        tags: ['VIP', '高净值'],
        riskLevel: 'R3',
      });
    });

    it('should handle missing optional fields gracefully', () => {
      const crmData = {
        id: 'CRM-002',
        full_name: '李四',
      };

      const mapped = service.mapCustomerData(crmData);

      expect(mapped.crmId).toBe('CRM-002');
      expect(mapped.name).toBe('李四');
      expect(mapped.phone).toBeNull();
      expect(mapped.idNumber).toBeNull();
      expect(mapped.tags).toEqual([]);
      expect(mapped.riskLevel).toBeNull();
    });

    it('should apply custom field mapping when provided', () => {
      const crmData = {
        cust_id: 'EXT-001',
        cust_name: '王五',
        cust_phone: '13900139000',
      };

      const fieldMap = {
        cust_id: 'crmId',
        cust_name: 'name',
        cust_phone: 'phone',
      };

      const mapped = service.mapCustomerData(crmData, fieldMap);

      expect(mapped).toEqual({
        crmId: 'EXT-001',
        name: '王五',
        phone: '13900139000',
        idNumber: null,
        tags: [],
        riskLevel: null,
      });
    });
  });

  describe('syncCustomers', () => {
    it('should sync customers from external CRM', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          customers: [
            {
              id: 'CRM-001',
              name: '张三',
              phone: '13800138000',
              idNumber: '110101199001011234',
            },
            {
              id: 'CRM-002',
              name: '李四',
              phone: '13900139000',
              idNumber: null,
            },
          ],
        },
      });

      (prisma.crmCustomerSync.createMany as any).mockResolvedValueOnce({ count: 2 });

      const result = await service.syncCustomers();

      expect(result.synced).toBe(2);
      expect(result.customers).toHaveLength(2);
      expect(prisma.crmCustomerSync.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ crmId: 'CRM-001', name: '张三' }),
          expect.objectContaining({ crmId: 'CRM-002', name: '李四' }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should sync with date filter', async () => {
      const since = new Date('2024-01-01');
      mockGet.mockResolvedValueOnce({
        data: { customers: [{ id: 'CRM-003', name: '王五' }] },
      });
      (prisma.crmCustomerSync.createMany as any).mockResolvedValueOnce({ count: 1 });

      const result = await service.syncCustomers(since);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('since=')
      );
      expect(result.synced).toBe(1);
    });

    it('should throw error when CRM API fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('CRM API unavailable'));

      await expect(service.syncCustomers()).rejects.toThrow('CRM API unavailable');
    });

    it('should handle empty sync response', async () => {
      mockGet.mockResolvedValueOnce({ data: { customers: [] } });
      (prisma.crmCustomerSync.createMany as any).mockResolvedValueOnce({ count: 0 });

      const result = await service.syncCustomers();

      expect(result.synced).toBe(0);
      expect(result.customers).toHaveLength(0);
    });
  });

  describe('getCustomerTags', () => {
    it('should read customer tags from CRM', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          customerId: 'CRM-001',
          tags: ['VIP', '高净值', '理财产品'],
        },
      });

      const tags = await service.getCustomerTags('CRM-001');

      expect(tags).toEqual(['VIP', '高净值', '理财产品']);
      expect(mockGet).toHaveBeenCalledWith('/customers/CRM-001/tags');
    });

    it('should return empty array when customer has no tags', async () => {
      mockGet.mockResolvedValueOnce({
        data: { customerId: 'CRM-002', tags: [] },
      });

      const tags = await service.getCustomerTags('CRM-002');

      expect(tags).toEqual([]);
    });

    it('should throw error when CRM returns 404', async () => {
      const error = new Error('Not Found') as any;
      error.response = { status: 404 };
      mockGet.mockRejectedValueOnce(error);

      await expect(service.getCustomerTags('CRM-NONEXISTENT')).rejects.toThrow();
    });

    it('should throw error when CRM API is unavailable', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));

      await expect(service.getCustomerTags('CRM-001')).rejects.toThrow('Network Error');
    });
  });

  describe('exportAudienceSegment', () => {
    it('should export audience segment to CRM', async () => {
      (prisma.audienceSegment.findUnique as any).mockResolvedValueOnce({
        id: 'seg-001',
        name: '高净值客户',
        conditions: [{ field: 'asset', operator: 'gte', value: 1000000 }],
        status: 'active',
      });

      (prisma.customer.findMany as any).mockResolvedValueOnce([
        { id: 'c1', name: '张三', segment: 'vip', asset: 5000000, tags: ['VIP'] },
        { id: 'c2', name: '李四', segment: 'vip', asset: 3000000, tags: ['VIP'] },
      ]);

      mockPost.mockResolvedValueOnce({
        data: { exportId: 'EXP-001', status: 'success', count: 2 },
      });

      const result = await service.exportAudienceSegment('seg-001', 'high_value_customers');

      expect(result.exportId).toBe('EXP-001');
      expect(result.count).toBe(2);
      expect(mockPost).toHaveBeenCalledWith(
        '/segments/high_value_customers/customers',
        expect.objectContaining({
          segmentName: '高净值客户',
          customers: expect.arrayContaining([
            expect.objectContaining({ crmId: 'c1', name: '张三' }),
          ]),
        })
      );
    });

    it('should throw error when segment not found', async () => {
      (prisma.audienceSegment.findUnique as any).mockResolvedValueOnce(null);

      await expect(
        service.exportAudienceSegment('nonexistent-seg', 'test_segment')
      ).rejects.toThrow('Audience segment not found');
    });

    it('should throw error when CRM export API fails', async () => {
      (prisma.audienceSegment.findUnique as any).mockResolvedValueOnce({
        id: 'seg-002',
        name: '测试段',
        conditions: [],
        status: 'active',
      });

      (prisma.customer.findMany as any).mockResolvedValueOnce([]);

      mockPost.mockRejectedValueOnce(new Error('CRM export failed'));

      await expect(
        service.exportAudienceSegment('seg-002', 'test')
      ).rejects.toThrow('CRM export failed');
    });

    it('should handle segment with no matching customers', async () => {
      (prisma.audienceSegment.findUnique as any).mockResolvedValueOnce({
        id: 'seg-003',
        name: '空段',
        conditions: [{ field: 'asset', operator: 'gte', value: 999999999 }],
        status: 'active',
      });

      (prisma.customer.findMany as any).mockResolvedValueOnce([]);

      mockPost.mockResolvedValueOnce({
        data: { exportId: 'EXP-002', status: 'success', count: 0 },
      });

      const result = await service.exportAudienceSegment('seg-003', 'empty_segment');

      expect(result.count).toBe(0);
    });
  });
});
