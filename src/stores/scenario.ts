import { create } from 'zustand';
import type { Scenario } from '@/services/scenario';

interface ScenarioState {
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  isLoading: boolean;
  error: string | null;
  category: string;
  search: string;
  setScenarios: (scenarios: Scenario[]) => void;
  setCurrentScenario: (scenario: Scenario | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCategory: (category: string) => void;
  setSearch: (search: string) => void;
  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, data: Partial<Scenario>) => void;
  removeScenario: (id: string) => void;
  reset: () => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: [],
  currentScenario: null,
  isLoading: false,
  error: null,
  category: '',
  search: '',
  
  setScenarios: (scenarios) => set({ scenarios }),
  setCurrentScenario: (currentScenario) => set({ currentScenario }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setCategory: (category) => set({ category }),
  setSearch: (search) => set({ search }),
  addScenario: (scenario) =>
    set((state) => ({ scenarios: [...state.scenarios, scenario] })),
  updateScenario: (id, data) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),
  removeScenario: (id) =>
    set((state) => ({
      scenarios: state.scenarios.filter((s) => s.id !== id),
    })),
  reset: () =>
    set({
      scenarios: [],
      currentScenario: null,
      isLoading: false,
      error: null,
    }),
}));