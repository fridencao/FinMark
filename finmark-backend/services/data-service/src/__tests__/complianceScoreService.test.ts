import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    complianceCheckLog: {
      findMany: vi.fn(),
    },
  },
}));

import { getComplianceScore } from '../services/complianceScoreService.js';
import { prisma } from '../config/database.js';

describe('complianceScoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 100 when no compliance logs exist', async () => {
    (prisma.complianceCheckLog.findMany as any).mockResolvedValueOnce([]);
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const result = await getComplianceScore(start, end);
    expect(result).toBe(100);
  });

  it('returns average score when logs exist', async () => {
    (prisma.complianceCheckLog.findMany as any).mockResolvedValueOnce([
      { score: 80 },
      { score: 90 },
      { score: 100 },
    ]);
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const result = await getComplianceScore(start, end);
    expect(result).toBe(90);
  });

  it('returns correct average for single log', async () => {
    (prisma.complianceCheckLog.findMany as any).mockResolvedValueOnce([
      { score: 75 },
    ]);
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const result = await getComplianceScore(start, end);
    expect(result).toBe(75);
  });
});
