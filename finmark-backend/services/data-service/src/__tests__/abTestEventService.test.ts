import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma so the service can be tested without a real DB
const findUniqueMock = vi.fn();
vi.mock('../config/database.js', () => ({
  prisma: {
    abTest: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: vi.fn(),
    },
  },
}));

// Mock abTestService.recordConversion to capture counts and avoid DB write
const recordConversionMock = vi.fn();
vi.mock('../services/abTestService.js', () => ({
  recordConversion: (...args: unknown[]) => recordConversionMock(...args),
}));

import { ingestEvents, _clearSeenForTests } from '../services/abTestEventService.js';

describe('abTestEventService.ingestEvents', () => {
  beforeEach(() => {
    _clearSeenForTests();
    recordConversionMock.mockReset();
    recordConversionMock.mockResolvedValue(undefined);
    findUniqueMock.mockReset();
  });

  it('throws when test not found', async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    await expect(ingestEvents('test-1', [{ branchId: 'b1', source: 'sms' }])).rejects.toThrow(/not found/i);
  });

  it('throws when test is not running', async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 'test-1', status: 'draft', branches: [] });
    await expect(ingestEvents('test-1', [{ branchId: 'b1', source: 'sms' }])).rejects.toThrow(/not running/i);
  });

  it('aggregates events by branch and calls recordConversion once per branch', async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: 'test-1',
      status: 'running',
      branches: [
        { id: 'b1', name: 'A' },
        { id: 'b2', name: 'B' },
      ],
    });
    const events = [
      { branchId: 'b1', source: 'sms', value: 1 },
      { branchId: 'b1', source: 'sms', value: 1 },
      { branchId: 'b2', source: 'wechat_work', value: 1 },
      { branchId: 'b1', source: 'app_push', value: 2 },
    ];
    const r = await ingestEvents('test-1', events);
    expect(r.total).toBe(4);
    expect(r.accepted).toBe(4);
    expect(r.rejected).toEqual([]);
    expect(r.conversionsAdded).toEqual({ b1: 4, b2: 1 });
    // 2 branches => 2 calls
    expect(recordConversionMock).toHaveBeenCalledTimes(2);
    expect(recordConversionMock).toHaveBeenCalledWith('test-1', 'b1', 4);
    expect(recordConversionMock).toHaveBeenCalledWith('test-1', 'b2', 1);
  });

  it('rejects unknown branchId and reports index + reason', async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: 'test-1',
      status: 'running',
      branches: [{ id: 'b1', name: 'A' }],
    });
    const events = [
      { branchId: 'b1', source: 'sms' },
      { branchId: 'ghost', source: 'sms' },
      { branchId: 'b1', source: 'sms' },
    ];
    const r = await ingestEvents('test-1', events);
    expect(r.accepted).toBe(2);
    expect(r.rejected).toEqual([
      { index: 1, eventId: undefined, reason: 'unknown branchId: ghost' },
    ]);
  });

  it('rejects event with missing source', async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: 'test-1',
      status: 'running',
      branches: [{ id: 'b1', name: 'A' }],
    });
    const r = await ingestEvents('test-1', [
      // @ts-expect-error: deliberately omitting required field
      { branchId: 'b1' },
    ]);
    expect(r.accepted).toBe(0);
    expect(r.rejected[0]?.reason).toMatch(/source is required/i);
  });

  it('idempotent: same eventId only counts once even on duplicate delivery', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'test-1',
      status: 'running',
      branches: [{ id: 'b1', name: 'A' }],
    });
    const event: Parameters<typeof ingestEvents>[1][number] = { eventId: 'evt-1', branchId: 'b1', source: 'sms' };
    const r1 = await ingestEvents('test-1', [event, event, event]);
    expect(r1.total).toBe(3);
    expect(r1.accepted).toBe(1);
    expect(r1.deduped).toBe(2);
    expect(r1.conversionsAdded.b1).toBe(1);
    expect(recordConversionMock).toHaveBeenCalledTimes(1);
  });

  it('default value is 1 when not provided', async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: 'test-1',
      status: 'running',
      branches: [{ id: 'b1', name: 'A' }],
    });
    const r = await ingestEvents('test-1', [
      { branchId: 'b1', source: 'sms' },
      { branchId: 'b1', source: 'sms' },
    ]);
    expect(r.conversionsAdded.b1).toBe(2);
  });

  it('value=0 or negative is treated as 1 (defensive)', async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: 'test-1',
      status: 'running',
      branches: [{ id: 'b1', name: 'A' }],
    });
    const r = await ingestEvents('test-1', [
      { branchId: 'b1', source: 'sms', value: 0 },
      { branchId: 'b1', source: 'sms', value: -5 },
    ]);
    expect(r.conversionsAdded.b1).toBe(2);
  });
});
