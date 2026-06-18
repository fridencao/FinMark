import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    complaint: {
      count: vi.fn(),
    },
  },
}));

import { getComplaintCount } from '../services/complaintService.js';
import { prisma } from '../config/database.js';

describe('complaintService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns complaint count for date range', async () => {
    (prisma.complaint.count as any).mockResolvedValueOnce(5);
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const result = await getComplaintCount(start, end);
    expect(result).toBe(5);
    expect(prisma.complaint.count).toHaveBeenCalledWith({
      where: { createdAt: { gte: start, lte: end } },
    });
  });

  it('returns 0 when no complaints exist', async () => {
    (prisma.complaint.count as any).mockResolvedValueOnce(0);
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const result = await getComplaintCount(start, end);
    expect(result).toBe(0);
  });
});
