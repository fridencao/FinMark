# Phase 5: Bug 修复 + 功能完善

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复代码质量问题，完善剩余功能，提升代码健壮性和用户体验

**依赖:** Phase 4 (前端 API 集成完成)

---

## Chunk 1: 代码质量修复

### 1.1 修复 setTimeout 内存泄漏

- [ ] **Step 1: 修复 src/app/factory/page.tsx:138 setTimeout**

```typescript
// ❌ 问题: setTimeout 无清理，组件卸载后可能触发状态更新
const handleAIGenerate = () => {
  if (!aiInput.trim()) return;
  setIsGenerating(true);
  setTimeout(() => {
    // ...
  }, 2000);
};

// ✅ 修复: 使用 useCallback + useRef
import { useRef, useCallback } from 'react';

export function FactoryPage() {
  const timeoutRef = useRef<number>();

  const handleAIGenerate = useCallback(() => {
    if (!aiInput.trim()) return;
    setIsGenerating(true);

    timeoutRef.current = window.setTimeout(() => {
      // ... 生成逻辑
      setIsGenerating(false);
    }, 2000);
  }, [aiInput]);

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
```

- [ ] **Step 2: 修复 src/components/copilot/RMChatDialog.tsx:62 setTimeout**

```typescript
// 同样使用 useRef + cleanup pattern
import { useRef, useEffect } from 'react';

export function RMChatDialog({ open, onOpenChange }: Props) {
  const typingTimeoutRef = useRef<number>();

  const handleSend = useCallback(() => {
    // ...
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
}
```

### 1.2 移除生产环境 console.log

- [ ] **Step 3: 移除或替换 console.* 语句**

```typescript
// src/services/api.ts
// ❌ console.error('API Error:', message);

// ✅ 替换为统一日志 (开发环境打印，生产上报)
const log = (level: 'error' | 'warn', ...args: any[]) => {
  if (import.meta.env.DEV) {
    console[level]('[API]', ...args);
  }
  // 生产环境可接入 Sentry: Sentry.captureMessage(args)
};

// src/components/copilot/ABTestCanvas.tsx:62
// ❌ console.log('AB Test Config:', ...);
// ✅ 使用 Zustand devtools 或移除
```

### 1.3 修复重复的 Zustand setter

- [ ] **Step 4: 修复 src/stores/copilot.ts**

```typescript
// ❌ 发现问题: setOrchestrating 和 setIsOrchestrating 重复定义
setOrchestrating: (isOrchestrating) => set({ isOrchestrating }),
setIsOrchestrating: (isOrchestrating) => set({ isOrchestrating }),

// ✅ 合并为一个
setOrchestrating: (value) => set({ isOrchestrating: value }),
```

### 1.4 修复 input-group.tsx (如果存在)

- [ ] **Step 5: 检查并修复任何组件中的空函数**

```bash
# 搜索潜在问题
grep -rn "const.*= () => {}" src/components/
grep -rn "return;" src/components/
```

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "fix(phase5): fix memory leaks and code quality issues"
```

---

## Chunk 2: 统一 i18n

### 2.1 迁移内联翻译到 translations

当前许多页面使用内联翻译对象而非 `src/i18n.ts` 中的 `translations`。统一迁移。

- [ ] **Step 1: 审计 i18n 使用情况**

```bash
# 查找使用内联翻译的页面
grep -l "const t = language === 'zh'" src/app/*/page.tsx
```

- [ ] **Step 2: 统一使用 translations**

```typescript
// ❌ 替换:
const t = language === 'zh' ? { title: 'xxx' } : { title: 'yyy' };

// ✅ 改为:
import { translations } from '@/i18n';
const t = translations[language];
```

- [ ] **Step 3: 扩展 translations**

在 `src/i18n.ts` 中添加缺失的翻译:

```typescript
// 添加缺失的翻译
export const translations = {
  zh: {
    // ... 现有翻译
    // Factory
    createScenario: '创建场景',
    aiGenerate: 'AI 智能生成',
    marketInspiration: '市场洞察',
    // Brain
    createAtom: '创建原子',
    strategyBrain: '策略大脑',
    // Expert
    expertMode: '专家模式',
    advancedAudience: '高级客群圈选',
    batchStrategy: '批量策略配置',
    // Settings
    modelConfig: '模型配置',
    systemIntegration: '系统集成',
    userManagement: '用户管理',
    permission: '权限管理',
  },
  en: {
    // 对应英文翻译
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n.ts src/app/*/page.tsx
git commit -m "fix(phase5): unify all translations to use i18n.ts"
```

---

## Chunk 3: Expert 模块完善

### 3.1 实现 WorkflowBuilder

- [ ] **Step 1: 完善 src/components/expert/WorkflowBuilder.tsx**

当前是占位组件，需要实现可视化工作流编排器。

```typescript
// 使用 reactflow 或 @xyflow/react 实现工作流编排
// 每个节点 = 一个智能体
// 连接线 = 数据流

import { ReactFlow, Background, Controls, addEdge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  return (
    <div className="h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

### 3.2 实现 TemplateManager

- [ ] **Step 2: 完善 src/components/expert/TemplateManager.tsx**

```typescript
// 实现模板 CRUD + 导入导出
export function TemplateManager() {
  // 使用 TanStack Query 获取模板列表
  // 实现创建、编辑、删除、导入、导出功能
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/expert/
git commit -m "feat(phase5): complete Expert module components"
```

---

## Chunk 4: Performance Report + Alarm 完善

### 4.1 实现 Report Center

- [ ] **Step 1: 完善 src/app/performance/report/page.tsx**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getActivityReports, exportReport } from '@/services/performance';

export default function ReportCenterPage() {
  const { data } = useQuery({
    queryKey: ['reports'],
    queryFn: () => getActivityReports(),
  });

  const reports = data?.data || [];

  const handleExport = async (id: string, format: 'excel' | 'pdf') => {
    const blob = await exportReport(id, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${id}.${format}`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 报表列表 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>报表名称</TableHead>
            <TableHead>时间范围</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report: any) => (
            <TableRow key={report.id}>
              <TableCell>{report.name}</TableCell>
              <TableCell>{report.dateRange}</TableCell>
              <TableCell>{report.createdAt}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => handleExport(report.id, 'excel')}>
                  导出 Excel
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 4.2 实现 Alarm Management

- [ ] **Step 2: 完善 src/app/performance/alarm/page.tsx**

```typescript
// 实现告警规则 CRUD
export default function AlarmManagementPage() {
  // 告警类型: metric (指标告警), task (任务告警), system (系统告警)
  // 支持配置阈值、触发条件、通知方式
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/performance/report/ src/app/performance/alarm/
git commit -m "feat(phase5): complete Report Center and Alarm Management"
```

---

## Chunk 5: 测试覆盖

### 5.1 添加 Vitest 测试框架

- [ ] **Step 1: 安装 Vitest**

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: 配置 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
});
```

### 5.2 添加核心测试

- [ ] **Step 3: 创建测试文件**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';

// src/__tests__/services/api.test.ts
import { describe, it, expect } from 'vitest';

describe('API Service', () => {
  it('should have auth interceptors', () => {
    // 测试 axios interceptors 配置
  });
});

// src/__tests__/stores/copilot.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCopilotStore } from '@/stores/copilot';

describe('Copilot Store', () => {
  it('should set goal', () => {
    const { result } = renderHook(() => useCopilotStore());
    act(() => {
      result.current.setGoal('test goal');
    });
    expect(result.current.goal).toBe('test goal');
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/
git commit -m "test(phase5): add Vitest and initial test coverage"
```

---

## Chunk 6: 清理和最终验证

### 6.1 更新 package.json

- [ ] **Step 1: 修复 package.json 中的问题**

```json
{
  "name": "finmark-ai",  // ❌ react-example → finmark-ai
  "version": "1.0.0",
  // ...
}
```

### 6.2 添加 .env.example 完善文档

- [ ] **Step 2: 更新 .env.example**

```bash
# FinMark AI Frontend

# API Base URL (开发环境指向 Kong Gateway 或直连 Data Service)
VITE_API_BASE_URL=http://localhost:8000

# Gemini API (前端 Mock 模式)
VITE_USE_MOCK=true
```

### 6.3 最终构建验证

- [ ] **Step 3: 运行完整验证**

```bash
# 1. TypeScript 检查
npm run lint
# 期望: 无错误

# 2. 构建测试
npm run build
# 期望: Exit code 0

# 3. 启动并测试
npm run dev
# 访问 http://localhost:3000
# 测试: 登录 → Copilot → Factory → Brain → Performance → Settings

# 4. 后端验证
cd finmark-backend
docker-compose up -d
pnpm dev

# 5. 端到端测试 (使用 Playwright)
npx playwright install
npx playwright test
```

- [ ] **Step 4: 最终 Commit**

```bash
git add .
git commit -m "feat(phase5): complete all bug fixes, polish, and testing"
```

---

## 验证清单

### 代码质量
- [ ] setTimeout 内存泄漏已修复
- [ ] console.log/console.error 已处理 (开发环境保留，生产环境移除或上报)
- [ ] 重复的 Zustand setter 已合并
- [ ] package.json name 已修复

### 功能完善
- [ ] 所有页面使用统一的 i18n translations
- [ ] WorkflowBuilder 可拖拽编排工作流
- [ ] TemplateManager 支持导入导出
- [ ] Report Center 支持 Excel/PDF 导出
- [ ] Alarm Management 支持告警规则 CRUD

### 测试
- [ ] Vitest 配置完成
- [ ] API service 测试通过
- [ ] Copilot store 测试通过
- [ ] 测试覆盖率 > 60%

### 最终
- [ ] `npm run lint` 无错误
- [ ] `npm run build` 成功
- [ ] `npm run dev` 正常启动
- [ ] 所有主要流程可正常运行
- [ ] 文档更新 (README.md)

---

## 发布检查清单

```bash
# 1. 代码审查
git diff --stat main...HEAD

# 2. 创建版本标签
git tag -a v1.0.0 -m "FinMark AI V1.0.0"
git push origin main --tags

# 3. Docker 镜像构建
cd finmark-backend
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. 生产环境验证
# - Health check 全部通过
# - 登录流程正常
# - Copilot 工作流正常
# - 数据持久化正常
```
