import { create } from 'zustand';
import type { StrategyAtom, ABTestConfig, TaskSchedule } from '@/services/strategy';

interface StrategyState {
  atoms: StrategyAtom[];
  currentAtom: StrategyAtom | null;
  abTests: ABTestConfig[];
  schedules: TaskSchedule[];
  isLoading: boolean;
  error: string | null;
  typeFilter: string;
  search: string;
  sortBy: string;
  setAtoms: (atoms: StrategyAtom[]) => void;
  setCurrentAtom: (atom: StrategyAtom | null) => void;
  setABTests: (tests: ABTestConfig[]) => void;
  setSchedules: (schedules: TaskSchedule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTypeFilter: (type: string) => void;
  setSearch: (search: string) => void;
  setSortBy: (sort: string) => void;
  addAtom: (atom: StrategyAtom) => void;
  updateAtom: (id: string, data: Partial<StrategyAtom>) => void;
  removeAtom: (id: string) => void;
  reset: () => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  atoms: [],
  currentAtom: null,
  abTests: [],
  schedules: [],
  isLoading: false,
  error: null,
  typeFilter: 'all',
  search: '',
  sortBy: 'usage',
  
  setAtoms: (atoms) => set({ atoms }),
  setCurrentAtom: (currentAtom) => set({ currentAtom }),
  setABTests: (abTests) => set({ abTests }),
  setSchedules: (schedules) => set({ schedules }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setSearch: (search) => set({ search }),
  setSortBy: (sortBy) => set({ sortBy }),
  addAtom: (atom) => set((state) => ({ atoms: [...state.atoms, atom] })),
  updateAtom: (id, data) =>
    set((state) => ({
      atoms: state.atoms.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  removeAtom: (id) =>
    set((state) => ({
      atoms: state.atoms.filter((a) => a.id !== id),
    })),
  reset: () =>
    set({
      atoms: [],
      currentAtom: null,
      abTests: [],
      schedules: [],
      isLoading: false,
      error: null,
    }),
}));