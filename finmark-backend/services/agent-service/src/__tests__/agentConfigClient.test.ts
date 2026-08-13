import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios before importing the client (the client binds DATA_SERVICE_URL
// at import time, but axios.get is called per request so we can stub it).
const getMock = vi.fn();
vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import { getModelFor, prefetch, _clearCache, ALL_AGENT_TYPES } from '../services/agentConfigClient.js';

describe('agentConfigClient', () => {
  beforeEach(() => {
    _clearCache();
    getMock.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches from data-service on cache miss and caches the modelId', async () => {
    getMock.mockResolvedValueOnce({
      status: 200,
      data: { success: true, data: { modelId: 'gemini-2.0-flash' } },
    });
    const m = await getModelFor('insight');
    expect(m).toBe('gemini-2.0-flash');
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('caches null modelId too (no infinite re-fetch on miss)', async () => {
    getMock.mockResolvedValueOnce({ status: 200, data: { success: true, data: {} } });
    const m1 = await getModelFor('segment');
    expect(m1).toBeNull();
    const m2 = await getModelFor('segment');
    expect(m2).toBeNull();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to null when data-service returns non-2xx', async () => {
    getMock.mockResolvedValueOnce({ status: 500, data: { success: false } });
    const m = await getModelFor('content');
    expect(m).toBeNull();
  });

  it('falls back to null on network error and does not throw', async () => {
    getMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const m = await getModelFor('compliance');
    expect(m).toBeNull();
  });

  it('re-fetches after the TTL window elapses', async () => {
    vi.useFakeTimers();
    try {
      getMock.mockResolvedValueOnce({ status: 200, data: { success: true, data: { modelId: 'a' } } });
      expect(await getModelFor('strategy')).toBe('a');
      getMock.mockResolvedValueOnce({ status: 200, data: { success: true, data: { modelId: 'b' } } });
      // 5min + 1s
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      expect(await getModelFor('strategy')).toBe('b');
      expect(getMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('caches per agentType independently', async () => {
    getMock.mockResolvedValue({ status: 200, data: { success: true, data: { modelId: 'shared' } } });
    await getModelFor('insight');
    await getModelFor('segment');
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it('prefetch warms the cache for all known agent types', async () => {
    getMock.mockResolvedValue({ status: 200, data: { success: true, data: { modelId: 'x' } } });
    await prefetch();
    expect(getMock).toHaveBeenCalledTimes(ALL_AGENT_TYPES.length);
    // subsequent call should hit cache, no extra fetch
    await getModelFor('insight');
    expect(getMock).toHaveBeenCalledTimes(ALL_AGENT_TYPES.length);
  });
});
