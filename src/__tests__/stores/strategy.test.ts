import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStrategyStore } from '@/stores/strategy';
import type { StrategyAtom, ABTestConfig, TaskSchedule } from '@/services/strategy';

function createAtom(overrides: Partial<StrategyAtom> = {}): StrategyAtom {
  return {
    id: '1',
    name: 'Atom 1',
    type: 'hook',
    usageCount: 10,
    tags: [],
    status: 'active',
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createSchedule(overrides: Partial<TaskSchedule> = {}): TaskSchedule {
  return {
    id: '1',
    name: 'Schedule 1',
    triggerType: 'periodic',
    triggerConfig: {},
    channels: [],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Strategy Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useStrategyStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have empty atoms array', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.atoms).toEqual([]);
    });

    it('should have null currentAtom', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.currentAtom).toBeNull();
    });

    it('should have empty abTests array', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.abTests).toEqual([]);
    });

    it('should have empty schedules array', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.schedules).toEqual([]);
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have null error', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.error).toBeNull();
    });

    it('should have typeFilter as all', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.typeFilter).toBe('all');
    });

    it('should have empty search', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.search).toBe('');
    });

    it('should have sortBy as usage', () => {
      const { result } = renderHook(() => useStrategyStore());
      expect(result.current.sortBy).toBe('usage');
    });
  });

  describe('setAtoms', () => {
    it('should set atoms', () => {
      const { result } = renderHook(() => useStrategyStore());
      const mockAtoms = [createAtom({ id: '1', name: 'Atom 1', type: 'hook', usageCount: 10, tags: [], status: 'active' })];

      act(() => {
        result.current.setAtoms(mockAtoms);
      });

      expect(result.current.atoms).toEqual(mockAtoms);
    });
  });

  describe('setCurrentAtom', () => {
    it('should set current atom', () => {
      const { result } = renderHook(() => useStrategyStore());
      const atom = createAtom({ id: '1', name: 'Atom 1', type: 'hook', usageCount: 10, tags: [], status: 'active' });

      act(() => {
        result.current.setCurrentAtom(atom);
      });

      expect(result.current.currentAtom).toEqual(atom);
    });
  });

  describe('setABTests', () => {
    it('should set AB tests', () => {
      const { result } = renderHook(() => useStrategyStore());
      const mockTests: ABTestConfig[] = [{ id: '1', name: 'Test 1', type: 'content', branches: [], metric: 'conversion', status: 'draft' }];

      act(() => {
        result.current.setABTests(mockTests);
      });

      expect(result.current.abTests).toEqual(mockTests);
    });
  });

  describe('setSchedules', () => {
    it('should set schedules', () => {
      const { result } = renderHook(() => useStrategyStore());
      const mockSchedules = [createSchedule({ id: '1', name: 'Schedule 1', triggerType: 'periodic', triggerConfig: {}, channels: [], status: 'active' })];

      act(() => {
        result.current.setSchedules(mockSchedules);
      });

      expect(result.current.schedules).toEqual(mockSchedules);
    });
  });

  describe('setLoading', () => {
    it('should set loading', () => {
      const { result } = renderHook(() => useStrategyStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      const { result } = renderHook(() => useStrategyStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('setTypeFilter', () => {
    it('should set type filter', () => {
      const { result } = renderHook(() => useStrategyStore());

      act(() => {
        result.current.setTypeFilter('hook');
      });

      expect(result.current.typeFilter).toBe('hook');
    });
  });

  describe('setSearch', () => {
    it('should set search', () => {
      const { result } = renderHook(() => useStrategyStore());

      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.search).toBe('test');
    });
  });

  describe('setSortBy', () => {
    it('should set sortBy', () => {
      const { result } = renderHook(() => useStrategyStore());

      act(() => {
        result.current.setSortBy('name');
      });

      expect(result.current.sortBy).toBe('name');
    });
  });

  describe('addAtom', () => {
    it('should add atom', () => {
      const { result } = renderHook(() => useStrategyStore());
      const atom = createAtom({ id: '1', name: 'New Atom', type: 'hook', usageCount: 0, tags: [], status: 'active' });

      act(() => {
        result.current.addAtom(atom);
      });

      expect(result.current.atoms).toHaveLength(1);
    });
  });

  describe('updateAtom', () => {
    it('should update atom when id matches', () => {
      const { result } = renderHook(() => useStrategyStore());
      const atom = createAtom({ id: '1', name: 'Original', type: 'hook', usageCount: 0, tags: [], status: 'active' });

      act(() => {
        result.current.setAtoms([atom]);
        result.current.updateAtom('1', { name: 'Updated' });
      });

      expect(result.current.atoms[0].name).toBe('Updated');
    });

    it('should not modify atoms when id does not match', () => {
      const { result } = renderHook(() => useStrategyStore());
      const atom1 = createAtom({ id: '1', name: 'Atom 1', type: 'hook', usageCount: 0, tags: [], status: 'active' });
      const atom2 = createAtom({ id: '2', name: 'Atom 2', type: 'content', usageCount: 0, tags: [], status: 'active' });

      act(() => {
        result.current.setAtoms([atom1, atom2]);
        result.current.updateAtom('999', { name: 'Updated' });
      });

      expect(result.current.atoms[0].name).toBe('Atom 1');
      expect(result.current.atoms[1].name).toBe('Atom 2');
    });
  });

  describe('removeAtom', () => {
    it('should remove atom', () => {
      const { result } = renderHook(() => useStrategyStore());
      const atom = createAtom({ id: '1', name: 'Atom 1', type: 'hook', usageCount: 0, tags: [], status: 'active' });

      act(() => {
        result.current.setAtoms([atom]);
        result.current.removeAtom('1');
      });

      expect(result.current.atoms).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should reset main state but preserve filters and sort', () => {
      const { result } = renderHook(() => useStrategyStore());

      act(() => {
        result.current.setAtoms([createAtom({ id: '1' })]);
        result.current.setCurrentAtom(createAtom({ id: '1' }));
        result.current.setABTests([{ id: '1' } as ABTestConfig]);
        result.current.setSchedules([{ id: '1' } as TaskSchedule]);
        result.current.setLoading(true);
        result.current.setError('error');
        result.current.setTypeFilter('hook');
        result.current.setSearch('search');
        result.current.setSortBy('name');
        result.current.reset();
      });

      expect(result.current.atoms).toEqual([]);
      expect(result.current.currentAtom).toBeNull();
      expect(result.current.abTests).toEqual([]);
      expect(result.current.schedules).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
