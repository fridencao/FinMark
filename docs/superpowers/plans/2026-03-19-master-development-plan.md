# FinMark AI 开发计划 (微服务架构)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 FinMark AI 前后端的全部开发，实现 PRD V1.0 中定义的功能

**Architecture:**
- **前端**: React 19 + TypeScript + Vite (现有)
- **后端**: 微服务架构 (Kong + Agent Service + Data Service + LLM Gateway)
- **数据库**: PostgreSQL + Redis
- **AI**: Google Gemini SDK (@google/genai)
- **部署**: Docker Compose

**Tech Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Docker, Kong, React, Tailwind CSS, Zustand

---

## 📍 当前状态

| 组件 | 状态 |
|------|------|
| 前端 UI | ✅ 基本完成 (约 70%) |
| Gemini Service | ⚠️ Mock 模式，无错误处理 |
| 后端服务 | ❌ 未实现 (仅有设计文档) |
| API 集成 | ❌ 所有 API 调用为空 |
| 数据持久化 | ❌ 无数据库 |
| 认证授权 | ❌ Mock 登录 |

---

## 🎯 阶段划分

```
阶段 1: 后端基础设施 + Data Service     [P0]
阶段 2: LLM Gateway + Agent Service    [P0]
阶段 3: Kong Gateway + 认证              [P0]
阶段 4: 前端 API 集成                   [P1]
阶段 5: Bug 修复 + 完善                 [P2]
```

---

## Phase 1: 后端基础设施 + Data Service ⭐ P0

**目标:** 创建后端 monorepo，搭建 PostgreSQL 数据库，实现场景、策略原子、用户管理的 CRUD API

**详细计划:** `docs/superpowers/plans/2026-03-19-phase1-backend-data-service.md`

**关键里程碑:**
- [ ] Docker Compose 启动 PostgreSQL + Redis
- [ ] Prisma Schema (User, Scenario, Atom, Execution, AuditLog)
- [ ] Data Service CRUD APIs
- [ ] JWT 认证中间件

**预计工作量:** 2-3 天

---

## Phase 2: LLM Gateway + Agent Service ⭐ P0

**目标:** 实现 LLM 网关和 6 个智能体（洞察、客群、内容、合规、策略、评估）+ 主智能体编排

**详细计划:** `docs/superpowers/plans/2026-03-19-phase2-agent-llm-gateway.md`

**关键里程碑:**
- [ ] LLM Gateway Service (统一调用 Gemini SDK)
- [ ] Agent Service (6 个智能体 + 主智能体编排)
- [ ] 流式输出 (SSE)
- [ ] 智能体与 Data Service 集成

**预计工作量:** 5-7 天

---

## Phase 3: Kong Gateway + 认证 ⭐ P0

**目标:** 搭建 Kong API Gateway，实现 JWT 认证、限流、CORS、安全头

**详细计划:** `docs/superpowers/plans/2026-03-19-phase3-kong-gateway-auth.md` (合并现有 Kong 计划)

**关键里程碑:**
- [ ] Kong Gateway 部署
- [ ] JWT 认证
- [ ] 限流规则
- [ ] CORS + 安全头
- [ ] 替换前端硬编码 Mock 登录

**预计工作量:** 2-3 天

---

## Phase 4: 前端 API 集成 ⭐ P1

**目标:** 将前端所有 Mock 数据和 API 调用替换为真实后端 API

**详细计划:** `docs/superpowers/plans/2026-03-19-phase4-frontend-integration.md`

**关键里程碑:**
- [ ] API 客户端配置 (baseURL, interceptors)
- [ ] Copilot 工作流完善 (6 智能体串联)
- [ ] Factory CRUD (创建/编辑/执行场景)
- [ ] Brain CRUD (策略原子管理)
- [ ] Settings API (模型配置、用户管理)
- [ ] Performance 数据接入
- [ ] Mock 模式 UI 提示标识
- [ ] Gemini Service 错误处理 + 重试

**预计工作量:** 5-7 天

---

## Phase 5: Bug 修复 + 功能完善 ⭐ P2

**目标:** 修复代码质量问题，完善剩余功能

**详细计划:** `docs/superpowers/plans/2026-03-19-phase5-bugfix-polish.md`

**关键里程碑:**
- [ ] Gemini Service async 错误处理
- [ ] setTimeout 内存泄漏修复
- [ ] Console.log 替换为日志服务
- [ ] Expert 模块 (WorkflowBuilder, TemplateManager)
- [ ] Performance Report + Alarm 功能
- [ ] i18n 统一 (全部页面使用 translations)
- [ ] 测试覆盖率 (从 Agent Service 开始)

**预计工作量:** 3-5 天

---

## 📊 总体时间线

```
Week 1-2: Phase 1 + Phase 2 (后端核心)
Week 3:   Phase 3 (API Gateway)
Week 4-5: Phase 4 (前端集成)
Week 6:   Phase 5 (完善)
Week 7:   集成测试 + 回归测试
Week 8:   部署 + 文档

总计: ~8 周
```

---

## 🔗 依赖关系

```
Phase 1 (完成)
    ↓
Phase 2 (依赖 Phase 1 数据库)
    ↓
Phase 3 (依赖 Phase 2 Agent Service)
    ↓
Phase 4 (依赖 Phase 1+2+3 所有后端)
    ↓
Phase 5 (依赖 Phase 4 前端)
```

---

## 📋 详细实施计划

| 阶段 | 计划文件 | 主要内容 |
|------|----------|----------|
| Phase 1 | `2026-03-19-phase1-backend-data-service.md` | 后端 monorepo、PostgreSQL、Prisma、CRUD APIs、JWT |
| Phase 2 | `2026-03-19-phase2-agent-llm-gateway.md` | LLM Gateway (Gemini SDK)、6 智能体、主智能体编排、流式输出 |
| Phase 3 | `2026-03-19-phase3-kong-gateway-auth.md` | Kong Gateway、限流、CORS、前端安全修复 |
| Phase 4 | `2026-03-19-phase4-frontend-integration.md` | 前端 API 集成、Copilot 工作流、Factory/Brain/Performance |
| Phase 5 | `2026-03-19-phase5-bugfix-polish.md` | Bug 修复、i18n 统一、Expert 完善、测试覆盖 |

---

## ✅ 验证标准

每个 Phase 完成后必须验证:

每个 Phase 完成后必须验证:

1. **单元测试通过** (覆盖率 > 60%)
2. **Docker Compose 所有服务正常启动**
3. **API 端点测试通过** (curl 或 Postman)
4. **前端页面可正常加载和交互**
5. **无 console.error / unhandled promise rejection**
