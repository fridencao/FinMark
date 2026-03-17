import { create } from 'zustand';

export type AgentType = 'insight' | 'segment' | 'content' | 'compliance' | 'strategy' | 'analyst';
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentExecution {
  type: AgentType;
  status: AgentStatus;
  result?: any;
  error?: string;
}

interface CopilotState {
  goal: string;
  isOrchestrating: boolean;
  isLoading: boolean;
  currentStep: number;
  masterResult?: string;
  agentResults: Record<AgentType, AgentExecution>;
  setGoal: (goal: string) => void;
  setOrchestrating: (value: boolean) => void;
  setIsOrchestrating: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setCurrentStep: (step: number) => void;
  setMasterResult: (result: string) => void;
  setAgentResult: (type: AgentType, result: AgentExecution) => void;
  reset: () => void;
}

const initialState = {
  goal: '',
  isOrchestrating: false,
  isLoading: false,
  currentStep: 0,
  masterResult: undefined,
  agentResults: {} as Record<AgentType, AgentExecution>,
};

export const useCopilotStore = create<CopilotState>((set) => ({
  ...initialState,
  
  setGoal: (goal) => set({ goal }),
  setOrchestrating: (isOrchestrating) => set({ isOrchestrating }),
  setIsOrchestrating: (isOrchestrating) => set({ isOrchestrating }),
  setLoading: (isLoading) => set({ isLoading }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setMasterResult: (masterResult) => set({ masterResult }),
  setAgentResult: (type, result) =>
    set((state) => ({
      agentResults: { ...state.agentResults, [type]: result },
    })),
  reset: () => set(initialState),
}));