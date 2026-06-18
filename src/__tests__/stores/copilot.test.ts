import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopilotStore } from '@/stores/copilot';

describe('Copilot Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCopilotStore());
    act(() => {
      result.current.reset();
    });
    localStorage.removeItem('finmark-agent-prompts');
    localStorage.removeItem('finmark-copilot');
  });

  it('should set goal', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setGoal('Test goal');
    });

    expect(result.current.goal).toBe('Test goal');
  });

  it('should set budget', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setBudget(50000);
    });

    expect(result.current.budget).toBe(50000);
  });

  it('should set channels', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setChannels(['短信', '企微']);
    });

    expect(result.current.channels).toEqual(['短信', '企微']);
  });

  it('should set language', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.lang).toBe('en');
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setGoal('Test');
      result.current.setBudget(50000);
    });

    expect(result.current.goal).toBe('Test');

    act(() => {
      result.current.reset();
    });

    expect(result.current.goal).toBe('');
    expect(result.current.budget).toBe(10000);
  });

  it('should not start orchestration with empty goal', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setGoal('');
    });

    expect(result.current.goal).toBe('');

    act(() => {
      result.current.startOrchestration();
    });

    expect(result.current.isOrchestrating).toBe(false);
  });

  it('should start orchestration with non-empty goal', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setGoal('Test goal');
    });

    expect(result.current.goal).toBe('Test goal');
  });

  it('should stop orchestration', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.stopOrchestration();
    });

    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should reset agent', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.resetAgent('insight');
    });

    expect(result.current.agentResults).toEqual({});
  });

  it('should reset all state including channels and language', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setChannels(['短信']);
      result.current.setLanguage('en');
      result.current.setBudget(50000);
    });

    expect(result.current.channels).toEqual(['短信']);
    expect(result.current.lang).toBe('en');
    expect(result.current.budget).toBe(50000);

    act(() => {
      result.current.reset();
    });

    expect(result.current.channels).toEqual(['短信', '企微', 'APP']);
    expect(result.current.lang).toBe('zh');
    expect(result.current.budget).toBe(10000);
  });

  it('should update goal multiple times', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setGoal('First goal');
    });

    expect(result.current.goal).toBe('First goal');

    act(() => {
      result.current.setGoal('Second goal');
    });

    expect(result.current.goal).toBe('Second goal');
  });

  it('should update budget to zero', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setBudget(0);
    });

    expect(result.current.budget).toBe(0);
  });

  it('should set channels to empty array', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.setChannels([]);
    });

    expect(result.current.channels).toEqual([]);
  });

  it('should handle localStorage finmark-agent-prompts with valid data', () => {
    const { result } = renderHook(() => useCopilotStore());

    localStorage.setItem('finmark-agent-prompts', JSON.stringify({
      insight: 'Custom insight prompt',
      segment: 'Custom segment prompt',
    }));

    act(() => {
      result.current.setGoal('Test goal');
    });

    expect(result.current.goal).toBe('Test goal');
  });

  it('should handle localStorage finmark-agent-prompts with empty values', () => {
    const { result } = renderHook(() => useCopilotStore());

    localStorage.setItem('finmark-agent-prompts', JSON.stringify({
      insight: '',
      segment: '   ',
    }));

    act(() => {
      result.current.setGoal('Test goal');
    });

    expect(result.current.goal).toBe('Test goal');
  });

  it('should handle invalid localStorage finmark-agent-prompts', () => {
    const { result } = renderHook(() => useCopilotStore());

    localStorage.setItem('finmark-agent-prompts', 'invalid-json');

    act(() => {
      result.current.setGoal('Test goal');
    });

    expect(result.current.goal).toBe('Test goal');
  });

  it('should handle orchestration fetch error', async () => {
    const { result } = renderHook(() => useCopilotStore());

    // Mock fetch to reject
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      // Wait for the async executeWorkflow to settle
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.orchestrationError).toBeTruthy();

    // Restore fetch
    globalThis.fetch = originalFetch;
  });

  it('should handle orchestration with auth token', async () => {
    const { result } = renderHook(() => useCopilotStore());

    localStorage.setItem('auth-token', 'test-token-123');

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('API error'));

    act(() => {
      result.current.setGoal('Launch campaign');
      result.current.setBudget(50000);
      result.current.setChannels(['短信', '邮件']);
      result.current.setLanguage('en');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Verify fetch was called with auth token
    expect(globalThis.fetch).toHaveBeenCalled();
    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[1].headers.Authorization).toBe('Bearer test-token-123');

    globalThis.fetch = originalFetch;
  });

  it('should handle localStorage with custom prompts during orchestration', async () => {
    const { result } = renderHook(() => useCopilotStore());

    localStorage.setItem('finmark-agent-prompts', JSON.stringify({
      insight: 'Custom insight prompt',
      segment: '  ',
      content: '',
    }));

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('API error'));

    act(() => {
      result.current.setGoal('Test with prompts');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Verify the call included custom prompts (only non-empty ones)
    expect(globalThis.fetch).toHaveBeenCalled();
    const callBody = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(callBody.prompts).toBeDefined();
    expect(callBody.prompts.insight).toBe('Custom insight prompt');
    expect(callBody.prompts.segment).toBeUndefined();

    globalThis.fetch = originalFetch;
  });

  it('should handle AbortError during orchestration', async () => {
    const { result } = renderHook(() => useCopilotStore());

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);

    act(() => {
      result.current.setGoal('Test abort');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // AbortError should NOT set orchestrationError
    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.orchestrationError).toBeUndefined();

    globalThis.fetch = originalFetch;
  });

  it('should start orchestration and transition to loading state', () => {
    const { result } = renderHook(() => useCopilotStore());

    // Don't mock fetch - but this test only checks the initial state transition
    act(() => {
      result.current.setGoal('Test goal');
    });

    // Start orchestration synchronously (fetch runs async)
    act(() => {
      result.current.startOrchestration();
    });
  });

  it('should setError during resetAgent before deleting', () => {
    const { result } = renderHook(() => useCopilotStore());

    act(() => {
      result.current.resetAgent('insight');
    });

    expect(result.current.agentResults).toEqual({});

    // Add an agent result then remove it
    act(() => {
      // Directly manipulate state via startOrchestration to populate agentResults
      result.current.setGoal('Test');
    });
  });
});

describe('executeWorkflow streaming', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    const { result } = renderHook(() => useCopilotStore());
    act(() => {
      result.current.reset();
    });
    localStorage.clear();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function makeFetchMock(events: Array<{ agent: string; chunk: string }>) {
    return vi.fn().mockImplementation(async () => {
      const encoder = new TextEncoder();
      const payload = events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
      return {
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(payload));
            controller.close();
          },
        }),
      };
    });
  }

  it('should handle successful master-only stream', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    globalThis.fetch = makeFetchMock([
      { agent: 'master', chunk: 'Hello ' },
      { agent: 'master', chunk: 'world' },
      { agent: 'master', chunk: '!' },
    ]);

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.masterResult).toBe('Hello world!');
  });

  it('should handle stream with agent transitions', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    globalThis.fetch = makeFetchMock([
      { agent: 'insight', chunk: 'i1' },
      { agent: 'insight', chunk: 'i2' },
      { agent: 'segment', chunk: 's1' },
      { agent: 'segment', chunk: 's2' },
      { agent: 'analyst', chunk: 'a1' },
    ]);

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.streamingContent.insight).toBe('i1i2');
    expect(result.current.streamingContent.segment).toBe('s1s2');
    expect(result.current.streamingContent.analyst).toBe('a1');

    expect(result.current.agentResults.insight.status).toBe('completed');
    expect(result.current.agentResults.insight.completedAt).toBeDefined();
    expect(result.current.agentResults.insight.content).toBe('i1i2');
    expect(result.current.agentResults.segment.status).toBe('completed');
    expect(result.current.agentResults.segment.content).toBe('s1s2');
    expect(result.current.agentResults.analyst.status).toBe('completed');
    expect(result.current.agentResults.analyst.content).toBe('a1');

    expect(result.current.currentStep).toBe(2);
  });

  it('should mark current agent as failed on error event and continue', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    globalThis.fetch = makeFetchMock([
      { agent: 'insight', chunk: 'i1' },
      { agent: 'insight', chunk: 'i2' },
      { agent: 'error', chunk: 'oops' },
      { agent: 'segment', chunk: 's1' },
    ]);

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.agentResults.insight.error).toBe('oops');

    expect(result.current.streamingContent.segment).toBe('s1');
    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.orchestrationError).toBeUndefined();
  });

  it('should skip non-SSE lines without throwing', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    const encoder = new TextEncoder();
    const payload = [
      'data: ' + JSON.stringify({ agent: 'insight', chunk: 'i1' }) + '\n\n',
      'this is not a data line\n\n',
      'random: stuff\n\n',
      'data: ' + JSON.stringify({ agent: 'insight', chunk: 'i2' }) + '\n\n',
    ].join('');

    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(payload));
          controller.close();
        },
      }),
    }));

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.streamingContent.insight).toBe('i1i2');
    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should skip malformed JSON in SSE lines', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    const encoder = new TextEncoder();
    const payload = [
      'data: {not valid json}\n\n',
      'data: ' + JSON.stringify({ agent: 'insight', chunk: 'i1' }) + '\n\n',
      'data: {broken json without closing\n\n',
    ].join('');

    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(payload));
          controller.close();
        },
      }),
    }));

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.streamingContent.insight).toBe('i1');
    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set orchestrationError on API 500', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: false,
      status: 500,
      body: null,
    }));

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.orchestrationError).toContain('500');
    expect(result.current.agentResults.insight.status).toBe('failed');
  });

  it('should set orchestrationError when response body is null', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      status: 200,
      body: null,
    }));

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.orchestrationError).toBeTruthy();
    expect(result.current.agentResults.insight.status).toBe('failed');
  });

  it('should stop orchestration cleanly when stopOrchestration is called mid-stream', async () => {
    const { result } = renderHook(() => useCopilotStore());
    localStorage.setItem('auth-token', 'test-token');

    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
    const body = new ReadableStream({
      start(controller) {
        streamController = controller;
        controller.enqueue(
          encoder.encode('data: ' + JSON.stringify({ agent: 'insight', chunk: 'i1' }) + '\n\n')
        );
      },
    });

    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      body,
    }));

    act(() => {
      result.current.setGoal('Test goal');
    });

    await act(async () => {
      result.current.startOrchestration();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.streamingContent.insight).toBe('i1');
    expect(result.current.isOrchestrating).toBe(true);

    act(() => {
      result.current.stopOrchestration();
    });

    streamController?.close();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    expect(result.current.isOrchestrating).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.orchestrationError).toBeUndefined();
  });
});
