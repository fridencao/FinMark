import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentType = 'insight' | 'segment' | 'content' | 'compliance' | 'strategy' | 'analyst';
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

type SseAgentType = AgentType | 'master' | 'error';

interface SseEvent {
  agent: SseAgentType;
  chunk: string;
}

export interface AgentExecution {
  type: AgentType;
  status: AgentStatus;
  content?: string;
  data?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface CopilotState {
  goal: string;
  budget: number;
  channels: string[];
  lang: 'zh' | 'en';
  isOrchestrating: boolean;
  isLoading: boolean;
  currentStep: number;
  masterResult?: string;
  orchestrationError?: string;
  agentResults: Record<AgentType, AgentExecution>;
  streamingContent: Record<AgentType, string>;
  setGoal: (goal: string) => void;
  setBudget: (budget: number) => void;
  setChannels: (channels: string[]) => void;
  setLanguage: (lang: 'zh' | 'en') => void;
  startOrchestration: () => void;
  stopOrchestration: () => void;
  resetAgent: (type: AgentType) => void;
  reset: () => void;
}

const initialState = {
  goal: '',
  budget: 10000,
  channels: ['短信', '企微', 'APP'],
  orchestrationError: undefined,
  lang: 'zh' as const,
  isOrchestrating: false,
  isLoading: false,
  currentStep: 0,
  masterResult: undefined,
  agentResults: {} as Record<AgentType, AgentExecution>,
  streamingContent: {} as Record<AgentType, string>,
};

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setGoal: (goal) => set({ goal }),
      setBudget: (budget) => set({ budget }),
      setChannels: (channels) => set({ channels }),
      setLanguage: (lang) => set({ lang }),

      startOrchestration: () => {
        const { goal } = get();
        if (!goal.trim()) return;
        set({ orchestrationError: undefined });
        executeWorkflow(get, set);
      },

      stopOrchestration: () => {
        stopController?.abort();
        set({ isOrchestrating: false, isLoading: false });
      },

      resetAgent: (type) =>
        set((state) => {
          const results = { ...state.agentResults };
          delete results[type];
          return { agentResults: results };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'finmark-copilot',
      partialize: (state) => ({
        goal: state.goal,
        budget: state.budget,
        channels: state.channels,
        lang: state.lang,
      }),
    }
  )
);

let stopController: AbortController | null = null;

async function executeWorkflow(
  get: () => CopilotState,
  set: (updater: any | ((s: CopilotState) => any)) => void
) {
  const { goal, budget, channels, lang } = get();
  stopController = new AbortController();
  const signal = stopController.signal;

  set({
    isOrchestrating: true,
    isLoading: true,
    currentStep: 0,
    masterResult: undefined,
    agentResults: {
      insight: { type: 'insight', status: 'pending' },
      segment: { type: 'segment', status: 'pending' },
      content: { type: 'content', status: 'pending' },
      compliance: { type: 'compliance', status: 'pending' },
      strategy: { type: 'strategy', status: 'pending' },
      analyst: { type: 'analyst', status: 'pending' },
    },
    streamingContent: {},
  });

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
  const agentServiceUrl = `${apiBase}/agents/master/stream`;
  const token = localStorage.getItem('auth-token');

  try {
    const response = await fetch(agentServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ goal, budget, channels, lang }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let currentAgent: SseAgentType | null = null;
    let masterContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done || signal.aborted) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const raw = line.slice(6).trim();
          if (!raw) continue;
          const data = JSON.parse(raw);

          if (data.agent === 'error') {
            if (currentAgent) {
              set((state: CopilotState) => ({
                agentResults: {
                  ...state.agentResults,
                  [currentAgent]: {
                    ...state.agentResults[currentAgent],
                    status: 'failed',
                    error: data.chunk,
                  },
                },
              }));
            }
            continue;
          }

          if (data.agent !== currentAgent) {
            if (currentAgent && currentAgent !== 'master') {
              set((state: CopilotState) => ({
                agentResults: {
                  ...state.agentResults,
                  [currentAgent]: {
                    ...state.agentResults[currentAgent],
                    status: 'completed',
                    content: (state.streamingContent as any)[currentAgent] || '',
                    completedAt: new Date(),
                  },
                },
                currentStep: state.currentStep + 1,
              }));
            }
            currentAgent = data.agent as SseAgentType;
            if (currentAgent !== 'master' && currentAgent !== 'error') {
              set((state: CopilotState) => ({
                agentResults: {
                  ...state.agentResults,
                  [currentAgent]: { type: currentAgent, status: 'running', startedAt: new Date() },
                },
              }));
            }
          }

          set((state: CopilotState) => ({
            streamingContent: {
              ...state.streamingContent,
              [currentAgent as AgentType]: ((state.streamingContent as any)[currentAgent as AgentType] || '') + data.chunk,
            },
          }));

          if (currentAgent === 'master') {
            masterContent += data.chunk;
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    if (currentAgent && currentAgent !== 'master') {
      set((state: CopilotState) => ({
        agentResults: {
          ...state.agentResults,
          [currentAgent]: {
            ...state.agentResults[currentAgent],
            status: 'completed',
            content: (state.streamingContent as any)[currentAgent] || '',
            completedAt: new Date(),
          },
        },
      }));
    }

    set({ isOrchestrating: false, isLoading: false, masterResult: masterContent });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      set({ isOrchestrating: false, isLoading: false });
      return;
    }
    const errorMessage = err?.response?.data?.message || err?.message || (get().lang === 'zh' ? '生成失败，请重试' : 'Generation failed, please try again');
    console.error('[Copilot] Orchestration failed:', err);
    set((state: CopilotState) => ({
      isOrchestrating: false,
      isLoading: false,
      orchestrationError: errorMessage,
      agentResults: {
        ...state.agentResults,
        insight: { ...state.agentResults.insight, status: 'failed', error: err.message },
      },
    }));
  }
}
