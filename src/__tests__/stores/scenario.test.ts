import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScenarioStore } from '@/stores/scenario';
import type { Scenario } from '@/services/scenario';

function createScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: '1',
    title: 'Scenario 1',
    goal: 'Goal 1',
    category: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Scenario Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useScenarioStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have empty scenarios array', () => {
      const { result } = renderHook(() => useScenarioStore());
      expect(result.current.scenarios).toEqual([]);
    });

    it('should have null currentScenario', () => {
      const { result } = renderHook(() => useScenarioStore());
      expect(result.current.currentScenario).toBeNull();
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useScenarioStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have null error', () => {
      const { result } = renderHook(() => useScenarioStore());
      expect(result.current.error).toBeNull();
    });

    it('should have empty category', () => {
      const { result } = renderHook(() => useScenarioStore());
      expect(result.current.category).toBe('');
    });

    it('should have empty search', () => {
      const { result } = renderHook(() => useScenarioStore());
      expect(result.current.search).toBe('');
    });
  });

  describe('setScenarios', () => {
    it('should set scenarios', () => {
      const { result } = renderHook(() => useScenarioStore());
      const mockScenarios = [createScenario({ id: '1', title: 'Scenario 1', goal: 'Goal 1' })];

      act(() => {
        result.current.setScenarios(mockScenarios);
      });

      expect(result.current.scenarios).toEqual(mockScenarios);
    });
  });

  describe('setCurrentScenario', () => {
    it('should set current scenario', () => {
      const { result } = renderHook(() => useScenarioStore());
      const scenario = createScenario({ id: '1', title: 'Scenario 1', goal: 'Goal 1' });

      act(() => {
        result.current.setCurrentScenario(scenario);
      });

      expect(result.current.currentScenario).toEqual(scenario);
    });

    it('should set current scenario to null', () => {
      const { result } = renderHook(() => useScenarioStore());

      act(() => {
        result.current.setCurrentScenario(null);
      });

      expect(result.current.currentScenario).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const { result } = renderHook(() => useScenarioStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useScenarioStore());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');
    });
  });

  describe('setCategory', () => {
    it('should set category', () => {
      const { result } = renderHook(() => useScenarioStore());

      act(() => {
        result.current.setCategory('marketing');
      });

      expect(result.current.category).toBe('marketing');
    });
  });

  describe('setSearch', () => {
    it('should set search', () => {
      const { result } = renderHook(() => useScenarioStore());

      act(() => {
        result.current.setSearch('campaign');
      });

      expect(result.current.search).toBe('campaign');
    });
  });

  describe('addScenario', () => {
    it('should add scenario to list', () => {
      const { result } = renderHook(() => useScenarioStore());
      const scenario = createScenario({ id: '1', title: 'New Scenario', goal: 'Goal' });

      act(() => {
        result.current.addScenario(scenario);
      });

      expect(result.current.scenarios).toHaveLength(1);
      expect(result.current.scenarios[0]).toEqual(scenario);
    });

    it('should append to existing scenarios', () => {
      const { result } = renderHook(() => useScenarioStore());
      const scenario1 = createScenario({ id: '1', title: 'Scenario 1', goal: 'Goal' });
      const scenario2 = createScenario({ id: '2', title: 'Scenario 2', goal: 'Goal' });

      act(() => {
        result.current.addScenario(scenario1);
        result.current.addScenario(scenario2);
      });

      expect(result.current.scenarios).toHaveLength(2);
    });
  });

  describe('updateScenario', () => {
    it('should update existing scenario', () => {
      const { result } = renderHook(() => useScenarioStore());
      const scenario = createScenario({ id: '1', title: 'Original', goal: 'Goal' });

      act(() => {
        result.current.setScenarios([scenario]);
        result.current.updateScenario('1', { title: 'Updated' });
      });

      expect(result.current.scenarios[0].title).toBe('Updated');
    });

    it('should not affect other scenarios', () => {
      const { result } = renderHook(() => useScenarioStore());
      const scenario1 = createScenario({ id: '1', title: 'Scenario 1', goal: 'Goal' });
      const scenario2 = createScenario({ id: '2', title: 'Scenario 2', goal: 'Goal' });

      act(() => {
        result.current.setScenarios([scenario1, scenario2]);
        result.current.updateScenario('1', { title: 'Updated' });
      });

      expect(result.current.scenarios[0].title).toBe('Updated');
      expect(result.current.scenarios[1].title).toBe('Scenario 2');
    });
  });

  describe('removeScenario', () => {
    it('should remove scenario from list', () => {
      const { result } = renderHook(() => useScenarioStore());
      const scenario = createScenario();

      act(() => {
        result.current.setScenarios([scenario]);
        result.current.removeScenario('1');
      });

      expect(result.current.scenarios).toHaveLength(0);
    });

    it('should not affect other scenarios', () => {
      const { result } = renderHook(() => useScenarioStore());
      const scenario1 = createScenario({ id: '1', title: 'Scenario 1', goal: 'Goal' });
      const scenario2 = createScenario({ id: '2', title: 'Scenario 2', goal: 'Goal' });

      act(() => {
        result.current.setScenarios([scenario1, scenario2]);
        result.current.removeScenario('1');
      });

      expect(result.current.scenarios).toHaveLength(1);
      expect(result.current.scenarios[0].id).toBe('2');
    });
  });

  describe('reset', () => {
    it('should reset main state but preserve category and search', () => {
      const { result } = renderHook(() => useScenarioStore());

      act(() => {
        result.current.setScenarios([createScenario({ id: '1' })]);
        result.current.setCurrentScenario(createScenario({ id: '1' }));
        result.current.setLoading(true);
        result.current.setError('error');
        result.current.setCategory('marketing');
        result.current.setSearch('test');
        result.current.reset();
      });

      expect(result.current.scenarios).toEqual([]);
      expect(result.current.currentScenario).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
