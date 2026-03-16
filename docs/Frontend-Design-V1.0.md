# FinMark AI 前端设计文档 V1.0

## 1. 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- Zustand (状态管理)
- TanStack Query (数据请求)
- Axios (HTTP客户端)
- React Hook Form + Zod (表单)
- Recharts (图表)

## 2. 目录结构

```
src/
├── app/                    # 页面路由
├── components/
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── layout/             # 布局组件
│   ├── copilot/            # Copilot 模块
│   ├── factory/            # Factory 模块
│   ├── brain/              # Brain 模块
│   ├── performance/        # Performance 模块
│   ├── agents/             # Agents 模块
│   └── common/             # 通用业务组件
├── hooks/
├── lib/
├── services/               # API 服务
├── stores/                # 状态管理
└── types/                 # 类型定义
```

## 3. shadcn/ui 组件安装

```bash
npx shadcn-ui@latest add button input card table dialog select tabs badge form switch slider avatar dropdown-menu command scroll-area separator popover checkbox progress collapsible accordion textarea alert tooltip calendar date-picker pagination
```

## 4. 页面结构

| 路径 | 组件 |
|------|------|
| / | 首页，重定向到 /copilot |
| /copilot | 智能营销助手 |
| /factory | 场景工厂 |
| /factory/:id | 场景详情/编辑 |
| /brain | 策略原子库 |
| /performance | 效果仪表盘 |
| /expert | 专家模式 |
| /agents | 智能体管理 |
| /settings | 系统设置 |

## 5. 核心组件

### 布局组件
- AppSidebar - 侧边导航
- AppHeader - 头部
- PageContainer - 页面容器

### Copilot 模块
- GoalInputSection - 目标输入
- QuickScenariosSection - 快捷场景
- WorkflowSection - 工作流编排
- AgentCard - 智能体结果卡片
- RMChatDialog - 话术对练弹窗
- ABTestCanvas - A/B测试画布

### Factory 模块
- ScenarioCard - 场景卡片
- ScenarioForm - 场景表单
- AIWizardDialog - AI生成弹窗
- MarketInsightCard - 市场洞察

### Brain 模块
- AtomCard - 策略原子卡片
- AtomForm - 原子表单
- AtomFilterBar - 筛选栏

### Performance 模块
- MetricCard - 指标卡片
- PerformanceChart - 效果图表
- ActivityTable - 活动表格
- AlarmRuleForm - 告警规则表单

### 通用组件
- ConditionBuilder - 条件构建器
- ChannelSelector - 渠道选择器
- ContentPreview - 内容预览
- JSONViewer - JSON查看器

## 6. API 服务

```
src/services/
├── api.ts              # Axios 实例
├── agent.ts            # 智能体 API
├── scenario.ts         # 场景 API
├── strategy.ts         # 策略 API
├── performance.ts      # 效果 API
├── settings.ts         # 设置 API
└── user.ts             # 用户 API
```

## 7. 状态管理

```
src/stores/
├── auth.ts             # 认证状态
├── app.ts              # 应用全局状态
├── copilot.ts          # Copilot 状态
├── scenario.ts         # 场景状态
├── strategy.ts         # 策略状态
├── performance.ts     # 效果状态
└── settings.ts         # 设置状态
```

## 8. 开发计划

| 阶段 | 任务 | 时间 |
|------|------|------|
| 一 | 基础搭建：项目初始化、组件安装、布局组件 | 2周 |
| 二 | Copilot模块：工作台、智能体编排、结果展示 | 2周 |
| 三 | Factory模块：场景列表、详情、AI生成 | 1周 |
| 四 | Brain模块：策略原子库 | 1周 |
| 五 | Performance模块：仪表盘、报表、告警 | 1周 |
| 六 | Agents和Settings模块 | 1周 |
| 七 | 测试优化 | 1周 |
| **总计** | | **9周** |

---

## 9. 各模块详细页面设计

### 9.1 Copilot 模块

#### CopilotPage（智能营销助手主页面）

**文件**: `src/app/copilot/page.tsx`

**功能**:
- 输入营销目标，生成完整的营销方案
- 展示6个智能体的工作流执行状态
- 展示各智能体的分析结果
- 支持快捷场景选择
- 支持策略画布和RM Copilot功能

**组件结构**:
```
┌─────────────────────────────────────────────────────────────┐
│ Header: 智能营销助手 + 语言切换 + 用户头像                   │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar │  Main Content                                    │
│ 工作台   │  ┌────────────────────────────────────────────┐  │
│ 智能体   │  │ GoalInputSection                          │  │
│ 历史记录 │  │ [输入框: 请输入营销目标...] [生成方案]     │  │
│          │  └────────────────────────────────────────────┘  │
│          │  ┌────────────────────────────────────────────┐  │
│          │  │ QuickScenariosSection                     │  │
│          │  │ [流失挽回][新发基金][信用卡分期][养老金]   │  │
│          │  └────────────────────────────────────────────┘  │
│          │  ┌────────────────────────────────────────────┐  │
│          │  │ WorkflowSection                           │  │
│          │  │ 洞察→客群→内容→合规→策略→评估              │  │
│          │  │ (每个节点展示状态和结果卡片)               │  │
│          │  └────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────┘
```

**使用组件**: Card, Input, Button, Badge, Tabs, Progress, Dialog, ScrollArea

#### CopilotWorkflowPage（工作流编排页面）

**文件**: `src/app/copilot/workflow/page.tsx`

**功能**:
- 可视化展示智能体执行流程
- 配置每个智能体的参数
- 调试和测试单个智能体

---

### 9.2 Factory 模块

#### FactoryPage（场景工厂首页）

**文件**: `src/app/factory/page.tsx`

**功能**:
- 展示所有场景列表
- 按分类筛选场景
- 支持搜索和排序
- AI智能生成新场景
- 创建新场景

**组件**: Card, Button, Tabs, Badge, Dialog, Input, Select

#### ScenarioDetailPage（场景详情页面）

**文件**: `src/app/factory/[id]/page.tsx`

**功能**:
- 查看和编辑场景配置
- 配置洞察、客群、内容、策略参数
- 保存和执行场景

**组件**: Form, Input, Textarea, Select, MultiSelect, Switch, Button

---

### 9.3 Brain 模块

#### BrainPage（策略原子库）

**文件**: `src/app/brain/page.tsx`

**功能**:
- 展示策略原子卡片列表
- 按类型、场景筛选
- 搜索和排序
- 创建新原子
- 查看原子详情

**组件**: Card, Input, Select, Tabs, Badge, Button, Table

---

### 9.4 Performance 模块

#### PerformancePage（效果仪表盘）

**文件**: `src/app/performance/page.tsx`

**功能**:
- 展示核心指标卡片
- 展示趋势图、饼图、柱状图
- 展示活动效果排名
- 时间范围选择
- 数据导出

**组件**: Card, Chart (Recharts), Table, DateRangePicker, Button, Select, Tabs

---

### 9.5 Agents 模块

#### AgentsPage（智能体管理）

**文件**: `src/app/agents/page.tsx`

**功能**:
- 展示6个智能体的状态卡片
- 显示调用次数、成功率
- 配置和调整智能体参数

**组件**: Card, Badge, Button, Switch, Table

---

### 9.6 Settings 模块

#### SettingsPage（系统设置）

**文件**: `src/app/settings/page.tsx`

**功能**:
- 模型配置：添加、编辑、测试大模型
- 系统集成：配置CRM、权益、渠道、大数据平台对接
- 用户管理：添加、编辑、删除用户
- 权限管理：配置角色和权限

**组件**: Card, Table, Form, Dialog, Select, Button

---

## 10. API 接口设计

### 10.1 智能体 API (src/services/agent.ts)

```typescript
// 洞察智能体
export const callInsightAgent = (data: InsightRequest) =>
  axios.post('/api/agents/insight', data);

// 客群智能体
export const callSegmentAgent = (data: SegmentRequest) =>
  axios.post('/api/agents/segment', data);

// 内容智能体
export const callContentAgent = (data: ContentRequest) =>
  axios.post('/api/agents/content', data);

// 合规智能体
export const callComplianceAgent = (data: ComplianceRequest) =>
  axios.post('/api/agents/compliance', data);

// 策略智能体
export const callStrategyAgent = (data: StrategyRequest) =>
  axios.post('/api/agents/strategy', data);

// 评估智能体
export const callEvaluationAgent = (data: EvaluationRequest) =>
  axios.post('/api/agents/evaluation', data);

// 主智能体编排
export const runMasterAgent = (goal: string, context?: any) =>
  axios.post('/api/agents/master', { goal, context });

// 流式调用
export const streamAgent = (type: string, goal: string, context?: any) =>
  axios.post(`/api/agents/${type}/stream`, { goal, context }, { responseType: 'stream' });

// RM Copilot
export const chatWithCustomer = (message: string, history: any[], context?: any) =>
  axios.post('/api/agents/copilot/chat', { message, history, context });
```

### 10.2 场景 API (src/services/scenario.ts)

```typescript
export const getScenarios = (params?: any) => axios.get('/api/scenarios', { params });
export const getScenario = (id: string) => axios.get(`/api/scenarios/${id}`);
export const createScenario = (data: any) => axios.post('/api/scenarios', data);
export const updateScenario = (id: string, data: any) => axios.put(`/api/scenarios/${id}`, data);
export const deleteScenario = (id: string) => axios.delete(`/api/scenarios/${id}`);
export const generateScenarioByAI = (description: string) =>
  axios.post('/api/scenarios/generate', { description });
export const executeScenario = (id: string, params?: any) =>
  axios.post(`/api/scenarios/${id}/execute`, params);
```

### 10.3 策略 API (src/services/strategy.ts)

```typescript
// 策略原子
export const getAtoms = (params?: any) => axios.get('/api/atoms', { params });
export const getAtom = (id: string) => axios.get(`/api/atoms/${id}`);
export const createAtom = (data: any) => axios.post('/api/atoms', data);
export const updateAtom = (id: string, data: any) => axios.put(`/api/atoms/${id}`, data);
export const deleteAtom = (id: string) => axios.delete(`/api/atoms/${id}`);

// A/B测试
export const getABTests = (params?: any) => axios.get('/api/abtests', { params });
export const createABTest = (data: any) => axios.post('/api/abtests', data);
export const startABTest = (id: string) => axios.post(`/api/abtests/${id}/start`);
export const stopABTest = (id: string) => axios.post(`/api/abtests/${id}/stop`);

// 任务调度
export const getSchedules = (params?: any) => axios.get('/api/schedules', { params });
export const createSchedule = (data: any) => axios.post('/api/schedules', data);
export const pauseSchedule = (id: string) => axios.post(`/api/schedules/${id}/pause`);
export const resumeSchedule = (id: string) => axios.post(`/api/schedules/${id}/resume`);
```

### 10.4 效果 API (src/services/performance.ts)

```typescript
export const getDashboardMetrics = (params: any) =>
  axios.get('/api/performance/dashboard', { params });
export const getDashboardTrend = (params: any) =>
  axios.get('/api/performance/trend', { params });
export const getActivityReports = (params?: any) =>
  axios.get('/api/performance/reports', { params });
export const exportReport = (id: string, format: 'excel' | 'pdf') =>
  axios.get(`/api/performance/reports/${id}/export`, { params: { format }, responseType: 'blob' });
export const getAlarmRules = () => axios.get('/api/performance/alarms');
export const createAlarmRule = (data: any) => axios.post('/api/performance/alarms', data);
```

### 10.5 设置 API (src/services/settings.ts)

```typescript
export const getModels = () => axios.get('/api/settings/models');
export const createModel = (data: any) => axios.post('/api/settings/models', data);
export const updateModel = (id: string, data: any) => axios.put(`/api/settings/models/${id}`, data);
export const deleteModel = (id: string) => axios.delete(`/api/settings/models/${id}`);
export const testModel = (id: string) => axios.post(`/api/settings/models/${id}/test`);
export const getIntegrations = () => axios.get('/api/settings/integrations');
export const updateIntegration = (type: string, config: any) =>
  axios.put(`/api/settings/integrations/${type}`, { config });
```

---

## 11. 状态管理设计

### 11.1 认证状态 (src/stores/auth.ts)

```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}
```

### 11.2 Copilot状态 (src/stores/copilot.ts)

```typescript
interface CopilotState {
  goal: string;
  isOrchestrating: boolean;
  isLoading: boolean;
  currentStep: number;
  masterResult?: string;
  agentResults: Record<AgentType, AgentExecution>;
  setGoal: (goal: string) => void;
  setOrchestrating: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setMasterResult: (result: string) => void;
  setAgentResult: (type: AgentType, result: AgentExecution) => void;
  reset: () => void;
}
```

### 11.3 应用全局状态 (src/stores/app.ts)

```typescript
interface AppState {
  language: 'zh' | 'en';
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  breadcrumbs: { label: string; href?: string }[];
  setLanguage: (lang: 'zh' | 'en') => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void;
}
```

---

## 12. 类型定义 (src/types/index.ts)

```typescript
export type AgentType = 'insight' | 'segment' | 'content' | 'compliance' | 'strategy' | 'analyst';
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ScenarioCategory = 'acquisition' | 'growth' | 'mature' | 'declining' | 'recovery';
export type AtomType = 'hook' | 'channel' | 'content' | 'risk';
export type AlarmType = 'metric' | 'task' | 'system';
export type UserRole = 'admin' | 'manager' | 'operator';
export type ChannelType = 'wechat' | 'sms' | 'app' | 'email' | 'call';
export type Language = 'zh' | 'en';
```