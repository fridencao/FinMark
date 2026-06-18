import { describe, it, expect, beforeEach, vi } from 'vitest';
import { join } from 'path';

vi.mock('../config/database.js', () => ({
  prisma: {
    execution: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    scenario: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    atom: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    audienceSegment: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    customer: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  const { PassThrough } = await import('stream');
  return {
    ...actual,
    createWriteStream: vi.fn(() => {
      const stream = new PassThrough();
      return stream;
    }),
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
  };
});

import * as reportExportService from '../services/reportExportService.js';
import { prisma } from '../config/database.js';

describe('reportExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('should generate an Excel file with multiple sheets', async () => {
      const config = {
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
      };

      const result = await reportExportService.exportToExcel(config);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\.xlsx$/);
    });

    it('should generate Excel with activity data', async () => {
      (prisma.execution.findMany as any).mockResolvedValueOnce([
        {
          id: 'exec-1',
          scenarioId: 'sc-1',
          status: 'completed',
          actualReach: 1000,
          actualResponse: 250,
          actualConversion: 50,
          createdAt: new Date('2025-01-15'),
          scenario: { title: 'Test Scenario', category: 'acquisition' },
        },
      ]);

      const result = await reportExportService.exportToExcel({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        type: 'activity',
      });

      expect(result).toMatch(/\.xlsx$/);
    });
  });

  describe('exportToPDF', () => {
    it('should generate a PDF file', async () => {
      const config = {
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
      };

      const result = await reportExportService.exportToPDF(config);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\.pdf$/);
    });

    it('should generate PDF with tables', async () => {
      (prisma.execution.findMany as any).mockResolvedValueOnce([
        {
          id: 'exec-1',
          scenarioId: 'sc-1',
          status: 'completed',
          actualReach: 500,
          actualResponse: 100,
          actualConversion: 20,
          createdAt: new Date('2025-01-15'),
          scenario: { title: 'Test Scenario' },
        },
      ]);

      const result = await reportExportService.exportToPDF({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
      });

      expect(result).toMatch(/\.pdf$/);
    });
  });

  describe('generateActivityReport', () => {
    it('should generate activity performance report as Excel', async () => {
      (prisma.execution.findMany as any).mockResolvedValueOnce([
        {
          id: 'exec-1',
          scenarioId: 'sc-1',
          status: 'completed',
          actualReach: 2000,
          actualResponse: 400,
          actualConversion: 80,
          createdAt: new Date('2025-01-10'),
          scenario: { title: 'Spring Campaign', category: 'growth' },
        },
        {
          id: 'exec-2',
          scenarioId: 'sc-2',
          status: 'completed',
          actualReach: 1500,
          actualResponse: 300,
          actualConversion: 60,
          createdAt: new Date('2025-01-20'),
          scenario: { title: 'Winter Promo', category: 'mature' },
        },
      ]);

      const result = await reportExportService.generateActivityReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
      expect(result.fileName).toMatch(/activity.*\.xlsx$/);
      expect(result.sheetNames).toContain('Activity Summary');
    });

    it('should generate activity report as PDF', async () => {
      (prisma.execution.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateActivityReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'pdf',
      });

      expect(result.fileName).toMatch(/activity.*\.pdf$/);
    });

    it('should handle empty data gracefully', async () => {
      (prisma.execution.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateActivityReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
      expect(result.fileName).toMatch(/\.xlsx$/);
    });
  });

  describe('generateAudienceReport', () => {
    it('should generate audience segment analysis report', async () => {
      (prisma.audienceSegment.findMany as any).mockResolvedValueOnce([
        {
          id: 'seg-1',
          name: 'High Value',
          description: 'Customers with high asset',
          conditions: { minAsset: 100000 },
          status: 'active',
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'seg-2',
          name: 'New Customers',
          description: 'Recently acquired',
          conditions: { maxDays: 30 },
          status: 'active',
          createdAt: new Date('2025-01-05'),
        },
      ]);
      (prisma.customer.findMany as any).mockResolvedValueOnce([
        { id: 'c-1', name: 'Alice', segment: 'High Value', asset: 150000, tags: ['vip'] },
        { id: 'c-2', name: 'Bob', segment: 'High Value', asset: 200000, tags: ['vip'] },
        { id: 'c-3', name: 'Charlie', segment: 'New Customers', asset: 50000, tags: ['new'] },
      ]);

      const result = await reportExportService.generateAudienceReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
      expect(result.fileName).toMatch(/audience.*\.xlsx$/);
      expect(result.sheetNames).toContain('Segments');
    });

    it('should generate audience report as PDF', async () => {
      (prisma.audienceSegment.findMany as any).mockResolvedValueOnce([]);
      (prisma.customer.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateAudienceReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'pdf',
      });

      expect(result.fileName).toMatch(/audience.*\.pdf$/);
    });

    it('should handle missing segments', async () => {
      (prisma.audienceSegment.findMany as any).mockResolvedValueOnce([]);
      (prisma.customer.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateAudienceReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
      expect(result.fileName).toMatch(/\.xlsx$/);
    });
  });

  describe('generateContentReport', () => {
    it('should generate content effectiveness report', async () => {
      (prisma.atom.findMany as any).mockResolvedValueOnce([
        {
          id: 'atom-1',
          name: 'Email Template A',
          type: 'content',
          successRate: 0.85,
          usageCount: 120,
          tags: ['email', 'promotion'],
          status: 'active',
        },
        {
          id: 'atom-2',
          name: 'SMS Template B',
          type: 'content',
          successRate: 0.72,
          usageCount: 80,
          tags: ['sms', 'reminder'],
          status: 'active',
        },
      ]);
      (prisma.execution.findMany as any).mockResolvedValueOnce([
        {
          id: 'exec-1',
          actualReach: 1000,
          actualResponse: 200,
          actualConversion: 40,
          result: { contentId: 'atom-1' },
          scenario: { title: 'Email Campaign' },
        },
      ]);

      const result = await reportExportService.generateContentReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
      expect(result.fileName).toMatch(/content.*\.xlsx$/);
      expect(result.sheetNames).toContain('Content Performance');
    });

    it('should generate content report as PDF', async () => {
      (prisma.atom.findMany as any).mockResolvedValueOnce([]);
      (prisma.execution.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateContentReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'pdf',
      });

      expect(result.fileName).toMatch(/content.*\.pdf$/);
    });

    it('should handle no content atoms', async () => {
      (prisma.atom.findMany as any).mockResolvedValueOnce([]);
      (prisma.execution.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateContentReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
    });
  });

  describe('generateChannelReport', () => {
    it('should generate channel performance report', async () => {
      (prisma.atom.findMany as any).mockResolvedValueOnce([
        {
          id: 'ch-1',
          name: 'WeChat',
          type: 'channel',
          successRate: 0.9,
          usageCount: 200,
          tags: ['social'],
          status: 'active',
        },
        {
          id: 'ch-2',
          name: 'SMS',
          type: 'channel',
          successRate: 0.75,
          usageCount: 150,
          tags: ['direct'],
          status: 'active',
        },
      ]);
      (prisma.execution.findMany as any).mockResolvedValueOnce([
        {
          id: 'exec-1',
          actualReach: 5000,
          actualResponse: 1000,
          actualConversion: 200,
          createdAt: new Date('2025-01-10'),
          result: { channel: 'WeChat' },
          scenario: { title: 'Q1 Campaign' },
        },
        {
          id: 'exec-2',
          actualReach: 3000,
          actualResponse: 450,
          actualConversion: 90,
          createdAt: new Date('2025-01-20'),
          result: { channel: 'SMS' },
          scenario: { title: 'Q1 Campaign' },
        },
      ]);

      const result = await reportExportService.generateChannelReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
      expect(result.fileName).toMatch(/channel.*\.xlsx$/);
      expect(result.sheetNames).toContain('Channel Performance');
    });

    it('should generate channel report as PDF', async () => {
      (prisma.atom.findMany as any).mockResolvedValueOnce([]);
      (prisma.execution.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateChannelReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'pdf',
      });

      expect(result.fileName).toMatch(/channel.*\.pdf$/);
    });

    it('should handle no channel data', async () => {
      (prisma.atom.findMany as any).mockResolvedValueOnce([]);
      (prisma.execution.findMany as any).mockResolvedValueOnce([]);

      const result = await reportExportService.generateChannelReport({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        format: 'excel',
      });

      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in Excel export', async () => {
      (prisma.execution.findMany as any).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(
        reportExportService.exportToExcel({
          dateRange: { start: '2025-01-01', end: '2025-01-31' },
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors gracefully in PDF export', async () => {
      (prisma.execution.findMany as any).mockRejectedValueOnce(
        new Error('Database timeout')
      );

      await expect(
        reportExportService.exportToPDF({
          dateRange: { start: '2025-01-01', end: '2025-01-31' },
        })
      ).rejects.toThrow('Database timeout');
    });

    it('should throw for unsupported format in generateActivityReport', async () => {
      await expect(
        reportExportService.generateActivityReport({
          dateRange: { start: '2025-01-01', end: '2025-01-31' },
          format: 'csv' as any,
        })
      ).rejects.toThrow('Unsupported format');
    });
  });
});
