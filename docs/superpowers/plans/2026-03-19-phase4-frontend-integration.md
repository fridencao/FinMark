# Phase 4: 前端 API 集成

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端所有 Mock 数据替换为真实后端 API，实现 Copilot 智能体工作流，完善交互逻辑

**Architecture:**
- 更新 `src/services/*.ts` 使用真实 API
- Copilot 使用 Agent Service 流式编排
- Factory/Brain/Settings 连接 Data Service CRUD
- Performance 连接 Data Service 报表 API
- 添加 Mock 模式 UI 提示

**Tech Stack:** React, TanStack Query, Zustand, axios

**依赖:** Phase 1 + Phase 2 + Phase 3 (后端服务运行)

---

## Chunk 1: 更新 API 服务层

### 1.1 更新 services/scenario.ts

- [ ] **Step 1: 重写 src/services/scenario.ts**

```typescript
import api from './api';

export interface Scenario {
  id: string;
  title: string;
  goal: string;
  category: string;
  icon?: string;
  color?: string;
  status: string;
  complianceScore?: number;
  riskLevel?: string;
  isCustom?: boolean;
  config?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScenarioInput {
  title: string;
  goal: string;
  category: string;
  icon?: string;
  color?: string;
  config?: any;
}

export interface UpdateScenarioInput extends Partial<CreateScenarioInput> {
  status?: string;
}

export const getScenarios = async (params?: {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/scenarios', { params });
  return response.data as { data: Scenario[]; pagination: any };
};

export const getScenario = async (id: string) => {
  const response = await api.get(`/scenarios/${id}`);
  return response.data as { data: Scenario };
};

export const getDefaultScenarios = async () => {
  const response = await api.get('/scenarios/defaults');
  return response.data as { data: Scenario[] };
};

export const createScenario = async (data: CreateScenarioInput) => {
  const response = await api.post('/scenarios', data);
  return response.data as { data: Scenario };
};

export const updateScenario = async (id: string, data: UpdateScenarioInput) => {
  const response = await api.put(`/scenarios/${id}`, data);
  return response.data as { data: Scenario };
};

export const deleteScenario = async (id: string) => {
  const response = await api.delete(`/scenarios/${id}`);
  return response;
};

export const generateScenarioByAI = async (description: string) => {
  const response = await api.post('/scenarios/generate', { description });
  return response.data;
};

export const executeScenario = async (id: string, config?: any) => {
  const response = await api.post(`/scenarios/${id}/execute`, config);
  return response.data;
};
```

### 1.2 更新 services/strategy.ts

- [ ] **Step 2: 重写 src/services/strategy.ts**

```typescript
import api from './api';

export interface Atom {
  id: string;
  name: string;
  type: 'hook' | 'channel' | 'content' | 'risk';
  description?: string;
  successRate?: number;
  usageCount: number;
  tags: string[];
  config?: any;
  scenarios?: string[];
  status: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export const getAtoms = async (params?: {
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/atoms', { params });
  return response.data as { data: Atom[]; pagination: any };
};

export const getAtom = async (id: string) => {
  const response = await api.get(`/atoms/${id}`);
  return response.data as { data: Atom };
};

export const createAtom = async (data: Partial<Atom>) => {
  const response = await api.post('/atoms', data);
  return response.data as { data: Atom };
};

export const updateAtom = async (id: string, data: Partial<Atom>) => {
  const response = await api.put(`/atoms/${id}`, data);
  return response.data as { data: Atom };
};

export const deleteAtom = async (id: string) => {
  const response = await api.delete(`/atoms/${id}`);
  return response;
};
```

### 1.3 更新 services/settings.ts

- [ ] **Step 3: 重写 src/services/settings.ts**

```typescript
import api from './api';

export interface Model {
  id: string;
  name: string;
  provider: string;
  apiUrl?: string;
  apiKey: string; // 仅在创建/编辑时使用，响应中应屏蔽
  modelVersion: string;
  temperature: number;
  maxTokens: number;
  status: string;
  isDefault: boolean;
}

export const getModels = async () => {
  const response = await api.get('/models');
  return response.data as { data: Model[] };
};

export const createModel = async (data: Omit<Model, 'id'>) => {
  const response = await api.post('/models', data);
  return response.data as { data: Model };
};

export const updateModel = async (id: string, data: Partial<Model>) => {
  const response = await api.put(`/models/${id}`, data);
  return response.data as { data: Model };
};

export const deleteModel = async (id: string) => {
  const response = await api.delete(`/models/${id}`);
  return response;
};

export const testModel = async (id: string) => {
  const response = await api.post(`/models/${id}/test`);
  return response.data;
};

export const getIntegrations = async () => {
  const response = await api.get('/integrations');
  return response.data;
};

export const updateIntegration = async (type: string, config: any) => {
  const response = await api.put(`/integrations/${type}`, { config });
  return response.data;
};
```

### 1.4 更新 services/user.ts

- [ ] **Step 4: 重写 src/services/user.ts**

```typescript
import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
}

export const getUsers = async (params?: { role?: string; page?: number; limit?: number }) => {
  const response = await api.get('/users', { params });
  return response.data as { data: User[]; pagination: any };
};

export const createUser = async (data: Omit<User, 'id' | 'createdAt'>) => {
  const response = await api.post('/users', data);
  return response.data as { data: User };
};

export const updateUser = async (id: string, data: Partial<User>) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data as { data: User };
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response;
};

export const getRoles = async () => {
  const response = await api.get('/users/roles');
  return response.data;
};
```

### 1.5 更新 services/performance.ts

- [ ] **Step 5: 重写 src/services/performance.ts**

```typescript
import api from './api';

export interface DashboardMetrics {
  reach: number;
  reachChange: number;
  responseRate: number;
  responseChange: number;
  conversionRate: number;
  conversionChange: number;
  roi: number;
  roiChange: number;
}

export interface TrendData {
  date: string;
  reach: number;
  response: number;
  conversion: number;
}

export interface ChannelDistribution {
  name: string;
  value: number;
  color?: string;
}

export interface ActivityReport {
  id: string;
  name: string;
  reach: string;
  response: string;
  conversion: string;
  roi: string;
  status: string;
}

export const getDashboardMetrics = async (params?: { timeRange?: string }) => {
  const response = await api.get('/performance/dashboard', { params });
  return response.data as { data: DashboardMetrics };
};

export const getDashboardTrend = async (params?: { timeRange?: string }) => {
  const response = await api.get('/performance/trend', { params });
  return response.data as { data: TrendData[] };
};

export const getActivityReports = async (params?: { page?: number; limit?: number }) => {
  const response = await api.get('/performance/reports', { params });
  return response.data as { data: ActivityReport[]; pagination: any };
};

export const exportReport = async (id: string, format: 'excel' | 'pdf') => {
  const response = await api.get(`/performance/reports/${id}/export`, {
    params: { format },
    responseType: 'blob',
  });
  return response;
};
```

- [ ] **Step 6: Commit**

```bash
git add src/services/{scenario,strategy,settings,user,performance}.ts
git commit -m "feat(phase4): update all API service layers to use real endpoints"
```

---

## Chunk 2: Copilot 智能体工作流完善

### 2.1 更新 Copilot Store

- [ ] **Step 1: 更新 src/stores/copilot.ts 添加完整状态管理**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { streamAgent } from '@/services/geminiService'; // 改为 Agent Service

export type AgentType = 'insight' | 'segment' | 'content' | 'compliance' | 'strategy' | 'analyst';
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

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
  // 输入
  goal: string;
  budget: number;
  channels: string[];
  lang: 'zh' | 'en';

  // 工作流状态
  isOrchestrating: boolean;
  isLoading: boolean;
  currentStep: number;
  masterResult?: string;
  agentResults: Record<AgentType, AgentExecution>;
  streamingContent: Record<AgentType, string>;

  // Actions
  setGoal: (goal: string) => void;
  setBudget: (budget: number) => void;
  setChannels: (channels: string[]) => void;
  setLanguage: (lang: 'zh' | 'en') => void;

  // 工作流
  startOrchestration: () => void;
  stopOrchestration: () => void;
  resetAgent: (type: AgentType) => void;
  reset: () => void;

  // 内部
  _setAgentResult: (type: AgentType, result: Partial<AgentExecution>) => void;
  _appendStreamingContent: (type: AgentType, chunk: string) => void;
  _setCurrentStep: (step: number) => void;
}

const initialState = {
  goal: '',
  budget: 10000,
  channels: ['短信', '企微', 'APP'],
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
        const { goal, budget, channels, lang } = get();
        if (!goal.trim()) return;

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

        // 流式调用 Agent Service
        streamAgentOrchestration({ goal, budget, channels, lang }, {
          onAgentStart: (type: AgentType) => {
            set((state) => ({
              agentResults: {
                ...state.agentResults,
                [type]: { type, status: 'running', startedAt: new Date() },
              },
            }));
          },
          onChunk: (type: AgentType, chunk: string) => {
            set((state) => ({
              streamingContent: {
                ...state.streamingContent,
                [type]: (state.streamingContent[type] || '') + chunk,
              },
            }));
          },
          onAgentComplete: (type: AgentType, result: any) => {
            set((state) => ({
              agentResults: {
                ...state.agentResults,
                [type]: {
                  ...state.agentResults[type],
                  status: 'completed',
                  content: result.content,
                  data: result.data,
                  completedAt: new Date(),
                },
              },
              currentStep: state.currentStep + 1,
            }));
          },
          onError: (type: AgentType, error: string) => {
            set((state) => ({
              agentResults: {
                ...state.agentResults,
                [type]: {
                  ...state.agentResults[type],
                  status: 'failed',
                  error,
                },
              },
            }));
          },
          onComplete: (masterContent: string) => {
            set({
              isOrchestrating: false,
              isLoading: false,
              masterResult: masterContent,
            });
          },
        });
      },

      stopOrchestration: () => set({ isOrchestrating: false, isLoading: false }),

      resetAgent: (type) =>
        set((state) => {
          const results = { ...state.agentResults };
          delete results[type];
          return { agentResults: results };
        }),

      reset: () => set(initialState),

      _setAgentResult: (type, result) =>
        set((state) => ({
          agentResults: { ...state.agentResults, [type]: { ...state.agentResults[type], ...result } },
        })),

      _appendStreamingContent: (type, chunk) =>
        set((state) => ({
          streamingContent: {
            ...state.streamingContent,
            [type]: (state.streamingContent[type] || '') + chunk,
          },
        })),

      _setCurrentStep: (step) => set({ currentStep: step }),
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

// 流式编排辅助函数 (调用 Agent Service)
async function streamAgentOrchestration(
  context: { goal: string; budget: number; channels: string[]; lang: 'zh' | 'en' },
  callbacks: {
    onAgentStart: (type: AgentType) => void;
    onChunk: (type: AgentType, chunk: string) => void;
    onAgentComplete: (type: AgentType, result: any) => void;
    onError: (type: AgentType, error: string) => void;
    onComplete: (masterContent: string) => void;
  }
) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/agents/master/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let currentAgent: AgentType | null = null;
    let masterContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.agent === 'error') {
              if (currentAgent) {
                callbacks.onError(currentAgent, data.chunk);
              }
              continue;
            }

            if (data.agent !== currentAgent) {
              if (currentAgent) {
                const results = useCopilotStore.getState().agentResults;
                callbacks.onAgentComplete(currentAgent, {
                  content: useCopilotStore.getState().streamingContent[currentAgent] || '',
                  data: {},
                });
              }
              currentAgent = data.agent as AgentType;
              if (currentAgent !== 'master' && currentAgent !== 'error') {
                callbacks.onAgentStart(currentAgent);
              }
            }

            callbacks.onChunk(currentAgent as AgentType, data.chunk);

            if (currentAgent === 'master') {
              masterContent += data.chunk;
            }
          } catch {
            // 解析错误，跳过
          }
        }
      }
    }

    if (currentAgent) {
      callbacks.onAgentComplete(currentAgent, {
        content: useCopilotStore.getState().streamingContent[currentAgent] || '',
        data: {},
      });
    }

    callbacks.onComplete(masterContent);
  } catch (err: any) {
    console.error('[Copilot] Orchestration failed:', err);
    callbacks.onError('insight', err.message);
  }
}
```

### 2.2 更新 Copilot Page

- [ ] **Step 2: 更新 src/app/copilot/page.tsx - 连接 Store**

```typescript
// 修改 CopilotPage 核心逻辑
import { useCopilotStore } from '@/stores/copilot';

// 在组件中
const { 
  goal, setGoal, isOrchestrating, isLoading, masterResult,
  agentResults, streamingContent,
  startOrchestration, stopOrchestration 
} = useCopilotStore();

// 绑定 GoalInputSection 的提交
const handleGenerate = () => {
  startOrchestration();
};

// 停止按钮
const handleStop = () => {
  stopOrchestration();
};
```

- [ ] **Step 3: 更新 WorkflowSection - 显示实时进度**

```typescript
// src/components/copilot/WorkflowSection.tsx
// 显示 6 个智能体的执行状态
const agentOrder: AgentType[] = ['insight', 'segment', 'content', 'compliance', 'strategy', 'analyst'];
const { agentResults, streamingContent } = useCopilotStore();

return (
  <div className="flex items-center gap-2">
    {agentOrder.map((agent, idx) => {
      const result = agentResults[agent];
      const content = streamingContent[agent] || '';
      return (
        <React.Fragment key={agent}>
          <AgentNode 
            agent={agent} 
            status={result?.status || 'pending'} 
            content={content}
          />
          {idx < agentOrder.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300" />}
        </React.Fragment>
      );
    })}
  </div>
);
```

### 2.3 更新 AgentResultsSection

- [ ] **Step 4: 更新 src/components/copilot/AgentResultsSection.tsx**

```typescript
import ReactMarkdown from 'react-markdown';

export function AgentResultsSection() {
  const { agentResults, streamingContent } = useCopilotStore();

  const agentLabels = {
    insight: { zh: '洞察分析', en: 'Insight Analysis' },
    segment: { zh: '客群筛选', en: 'Segment Generation' },
    content: { zh: '营销文案', en: 'Content Generation' },
    compliance: { zh: '合规审查', en: 'Compliance Review' },
    strategy: { zh: '触达策略', en: 'Reach Strategy' },
    analyst: { zh: '效果评估', en: 'Performance Analysis' },
  };

  return (
    <div className="space-y-4">
      {(Object.keys(agentResults) as AgentType[]).map((type) => {
        const result = agentResults[type];
        const content = streamingContent[type] || result?.content || '';
        if (!content) return null;

        return (
          <Card key={type} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold">{agentLabels[type]?.zh || type}</h4>
              <Badge>{result?.status}</Badge>
            </div>
            <ReactMarkdown className="prose prose-sm max-w-none">
              {content}
            </ReactMarkdown>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/copilot.ts src/app/copilot/ src/components/copilot/
git commit -m "feat(phase4): connect Copilot workflow to Agent Service with streaming"
```

---

## Chunk 3: Factory 页面 API 集成

### 3.1 重写 Factory Page

- [ ] **Step 1: 重写 src/app/factory/page.tsx 使用 TanStack Query**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getScenarios, getDefaultScenarios, createScenario, 
  updateScenario, deleteScenario, generateScenarioByAI 
} from '@/services/scenario';

// 替换 useState 数据为 TanStack Query
export function FactoryPage() {
  const { language } = useAppStore();
  const queryClient = useQueryClient();

  // 场景列表查询
  const { data: scenariosData, isLoading } = useQuery({
    queryKey: ['scenarios', activeCategory],
    queryFn: () => getScenarios(activeCategory !== 'all' ? { category: activeCategory } : {}),
  });

  // 默认场景查询
  const { data: defaultScenarios } = useQuery({
    queryKey: ['scenarios', 'defaults'],
    queryFn: getDefaultScenarios,
  });

  const scenarios = scenariosData?.data || defaultScenarios?.data || [];

  // 创建场景
  const createMutation = useMutation({
    mutationFn: createScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });

  // AI 生成场景
  const generateMutation = useMutation({
    mutationFn: generateScenarioByAI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });

  // 删除场景
  const deleteMutation = useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });

  // 搜索过滤
  const filteredScenarios = scenarios.filter(s => {
    const matchSearch = !searchTerm || 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.goal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'all' || s.category === activeCategory;
    return matchSearch && matchCategory;
  });

  // 处理 AI 生成
  const handleAIGenerate = () => {
    if (!aiInput.trim()) return;
    generateMutation.mutate(aiInput, {
      onSuccess: (result) => {
        // 创建生成的场景
        createMutation.mutate(result.data);
        setShowAIWizard(false);
        setAiInput('');
      },
    });
  };

  // 渲染场景列表 (isLoading 时显示骨架屏)
  if (isLoading) {
    return <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* 场景卡片列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredScenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onEdit={() => navigate(`/factory/${scenario.id}`)}
            onDelete={() => deleteMutation.mutate(scenario.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3.2 创建场景卡片组件

- [ ] **Step 2: 创建 src/components/factory/ScenarioCard.tsx**

```typescript
import { useMutation } from '@tanstack/react-query';
import { executeScenario } from '@/services/scenario';
import { useNavigate } from 'react-router-dom';

interface ScenarioCardProps {
  scenario: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function ScenarioCard({ scenario, onEdit, onDelete }: ScenarioCardProps) {
  const navigate = useNavigate();

  const executeMutation = useMutation({
    mutationFn: () => executeScenario(scenario.id),
    onSuccess: (result) => {
      // 显示执行结果或跳转到执行详情
      console.log('Execution started:', result);
    },
  });

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scenario.color || 'bg-slate-100'}`}>
            {/* Icon */}
          </div>
          <h4 className="font-semibold">{scenario.title}</h4>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit3 className="w-4 h-4" />
          </Button>
          {scenario.isCustom && (
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>
      {/* ... */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => executeMutation.mutate()}
          disabled={executeMutation.isPending}
        >
          {executeMutation.isPending ? '执行中...' : '执行'}
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/factory/page.tsx src/components/factory/
git commit -m "feat(phase4): connect Factory page to real API with TanStack Query"
```

---

## Chunk 4: Brain + Settings + Performance API 集成

### 4.1 重写 Brain Page

- [ ] **Step 1: 重写 src/app/brain/page.tsx**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAtoms, createAtom, deleteAtom } from '@/services/strategy';

export function BrainPage() {
  const { language } = useAppStore();
  const queryClient = useQueryClient();

  const { data: atomsData, isLoading } = useQuery({
    queryKey: ['atoms', typeFilter],
    queryFn: () => getAtoms(typeFilter !== 'all' ? { type: typeFilter } : {}),
  });

  const atoms = atomsData?.data || [];

  const createMutation = useMutation({
    mutationFn: createAtom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['atoms'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['atoms'] }),
  });

  // 过滤和排序逻辑保持不变，但使用真实数据
  // ...
}
```

### 4.2 重写 Performance Page

- [ ] **Step 2: 重写 src/app/performance/page.tsx**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics, getDashboardTrend, getActivityReports } from '@/services/performance';

export function PerformancePage() {
  const { language } = useAppStore();
  const [timeRange, setTimeRange] = useState('week');

  // 使用 TanStack Query 获取真实数据
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['performance', 'metrics', timeRange],
    queryFn: () => getDashboardMetrics({ timeRange }),
  });

  const { data: trendData } = useQuery({
    queryKey: ['performance', 'trend', timeRange],
    queryFn: () => getDashboardTrend({ timeRange }),
    select: (res) => res.data?.map((d: any) => ({
      name: d.date,
      reach: d.reach,
      response: d.response,
      conversion: d.conversion,
    })),
  });

  const { data: reportsData } = useQuery({
    queryKey: ['performance', 'reports'],
    queryFn: () => getActivityReports(),
  });

  const activityData = reportsData?.data || [];

  // 使用真实数据或 fallback 到 loading
  const metrics = metricsData?.data ? [
    { title: t.reach, value: formatNumber(metricsData.data.reach), change: metricsData.data.reachChange, up: metricsData.data.reachChange > 0 },
    // ...
  ] : metrics.map((m: any) => ({ ...m, value: '—', change: 0, up: true }));

  // ...
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/brain/page.tsx src/app/performance/page.tsx
git commit -m "feat(phase4): connect Brain and Performance pages to real APIs"
```

---

## Chunk 5: Mock 模式 UI + Gemini Service 错误处理

### 5.1 添加 Mock 模式检测和警告

- [ ] **Step 1: 创建 src/hooks/useMockMode.ts**

```typescript
import { useState, useEffect } from 'react';

export function useMockMode() {
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    // 检查 API 响应头或配置
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const isLocal = apiBaseUrl === '/api' || apiBaseUrl.includes('localhost');

    // 如果是本地开发且 API 不可用，显示 mock 提示
    if (isLocal) {
      setIsMockMode(true);
    }
  }, []);

  return isMockMode;
}
```

- [ ] **Step 2: 创建 MockModeBanner 组件**

```typescript
// src/components/common/MockModeBanner.tsx
import { AlertTriangle } from 'lucide-react';

export function MockModeBanner() {
  const isDev = import.meta.env.DEV;

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 max-w-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <p className="text-xs font-medium text-amber-800">Mock 模式</p>
          <p className="text-xs text-amber-600">
            当前使用 Mock 数据或 API 未配置。设置 VITE_API_BASE_URL 启用真实 API。
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 在 Layout 中添加 MockModeBanner**

```typescript
// src/components/layout/Layout.tsx
import { MockModeBanner } from '@/components/common/MockModeBanner';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <MockModeBanner />
    </div>
  );
}
```

### 5.2 完善 Gemini Service 错误处理

- [ ] **Step 4: 更新 src/services/geminiService.ts**

```typescript
// 添加重试逻辑和更好的错误处理
export async function callAgent(
  agentType: string,
  prompt: string,
  context?: any,
  lang: string = 'zh'
): Promise<AgentResponse> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ... 调用逻辑

      return { content: parsed.content || "未生成具体内容", data: parsed.data };
    } catch (error: any) {
      lastError = error;
      console.warn(`[Gemini] Attempt ${attempt} failed:`, error?.message);

      if (attempt < maxRetries) {
        // 指数退避: 1s, 2s, 4s
        await sleep(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }

  // 所有重试都失败
  console.error(`[Gemini] All ${maxRetries} attempts failed`);
  return {
    content: `⚠️ AI 服务暂时不可用，请稍后重试。\n\n错误信息: ${lastError?.message}`,
    data: null,
  };
}

// 流式调用也添加重试
export async function* streamAgent(...) {
  // 添加相同的重试逻辑
  // ...
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMockMode.ts src/components/common/MockModeBanner.tsx
git add src/services/geminiService.ts
git commit -m "feat(phase4): add mock mode banner and error handling"
```

---

## Chunk 6: Auth Store 完善

### 6.1 更新 Auth Store

- [ ] **Step 1: 更新 src/stores/auth.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  fetchCurrentUser: () => Promise<void>;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
        localStorage.setItem('auth-token', token);
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      fetchCurrentUser: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      checkAuth: () => {
        const token = localStorage.getItem('auth-token');
        if (token && !get().isAuthenticated) {
          get().fetchCurrentUser();
          return true;
        }
        return get().isAuthenticated;
      },
    }),
    {
      name: 'finmark-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 6.2 更新 AuthGuard

- [ ] **Step 2: 更新 src/components/auth/AuthGuard.tsx**

```typescript
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    // 页面加载时验证 token 有效性
    if (!isAuthenticated) {
      fetchCurrentUser();
    }
  }, []);

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/auth.ts src/components/auth/AuthGuard.tsx
git commit -m "feat(phase4): enhance auth store with token validation"
```

---

## 验证清单

- [ ] 前端 `.env.local` 设置 `VITE_API_BASE_URL=http://localhost:8000`
- [ ] 登录页使用真实 API (无硬编码凭据)
- [ ] Copilot 页面点击"生成方案"触发流式编排
- [ ] 6 个智能体状态实时更新
- [ ] Factory 页面显示真实场景列表 (或 Mock banner)
- [ ] Brain 页面显示策略原子列表
- [ ] Performance 页面显示真实指标数据
- [ ] Settings 页面用户管理可用
- [ ] Mock 模式下右下角显示警告条
- [ ] API 错误时显示友好错误提示
- [ ] 401 响应自动跳转登录页
- [ ] `npm run lint` 无错误
- [ ] 所有 TanStack Query 正确配置 (stale time, retry, etc.)
