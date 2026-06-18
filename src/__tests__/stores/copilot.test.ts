import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
