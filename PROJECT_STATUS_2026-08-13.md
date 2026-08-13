# FinMark 多智能体营销平台 — 项目现状盘点

> 盘点日期:2026-08-13
> 数据来源:git `a0ea00a`(本机 main HEAD) + 本地代码扫描
> 上一份:`PROJECT_STATUS_2026-07-25.md`(已过期,本份是更新版)

---

## 0. 一句话总览

两天集中推进(2026-08-12 ~ 13),**main 从 8 周未动 → 17 个 commit**;PRD V1.0 全部 17 项功能模块验收完毕,基础设施(CI/AGENTS.md/lockfile)同步到位。**唯一外部依赖阻塞**:GitHub OAuth token 无 `workflow` scope,导致 `.github/workflows/tests.yml` 没法直接 push(细节见 §5)。

---

## 1. 总体状态

- **项目类型**:企业级多智能体金融营销平台(monorepo)
- **Git 状态**:`main` HEAD `a0ea00a`,远端已同步;上一冻结点 `de09284`(6-19),中间 **8 周** 完全没动,8-12 起恢复
- **最近 2 天(8-12 ~ 8-13)**:17 commit / 37 文件 / +1754 / -334
- **当前静态指标**:
  - 前端 src 文件:120,测试文件 14
  - 后端 src 文件 97(3 个 Express 微服务),测试文件 19 + 1 集成
  - 前端测试:**17 文件 / 254 测试 全过**
  - 后端 data-service 测试:**19 文件 / 323 测试 全过**
  - 后端 agent-service 测试:**1 文件 / 7 测试 全过**(新加)
  - tsc 三个 workspace 全绿

---

## 2. 两天做了什么(按 commit 时间线)

```
8-12 上午
  28be231  fix(scenario-ai): /generate 接通真实 llm-gateway
  6dbd29d  fix(ab-test): pValue/多分支/路由对齐
  58be3a8  fix(bigdata): real health check
  6461bef  Merge P0 阶段三件套
  8be9342  chore(repo): .gitignore 加固(防止 lockfile 漂移)
  b4bf3a9  feat(scenario-ai): /generate 对齐 PRD 4.2
  7b2ff71  feat(scenario-ai): 工厂页四段预览 + 确认落库
  ef6503a  Merge P1-A 场景 AI 四段
  38760b0  chore(test): jsdom localStorage polyfill
  147243f  Merge 测试卫生
  f48b6d8  feat(auth): SMS OTP service + mock provider
  d3d0956  feat(auth): /auth/otp/request + /otp/verify
  ccbc880  feat(login): 短信登录 tab
  28859ea  Merge 短信验证码(PRD 9.2 验收项)

8-13 上午
  e481622  docs(db): phone migration deploy README
  667f228  docs(agents): AGENTS.md 同步(jsdom/CI/db push 等 gotcha)
  a0ea00a  feat(agent): per-agent 模型绑定(PRD 8.2 验收项)
```

3 个主题:
1. **P0 修复**:把"假 AI / 假 A/B / 假 health"变成真的
2. **P1 推进**:场景 AI 四段链路(P1-A)+ 短信验证码(验收硬项 P1-D)
3. **基础设施**:仓库卫生 / 测试卫生 / CI / 文档同步 / per-agent 模型绑定

---

## 3. PRD V1.0 验收(24 项)

| # | 模块 | 状态 | 备注 |
|---|------|------|------|
| 1 | 智能体编排 6 个 + 协同 | ✅ | master + insight/segment/content/compliance/strategy/analyst,master 支持 SSE |
| 2 | 场景预设模板 4 个 | ✅ | seed.ts 已预置流失挽回/新发基金/信用卡分期/养老金开户 |
| 3 | 场景 CRUD + AI 生成 | ✅ | **P1-A 升级**:四段结构 + zod 校验 + 失败显式 errors |
| 4 | 策略原子库 4 类 | ✅ | Brain(atoms) + 路由完整 |
| 5 | A/B 测试多类型 | ✅ | **P0 修复**:pValue 正确、多分支对比、路由对齐 |
| 6 | 任务调度 三类触发 | ✅ | 定时/周期/事件,暂停/恢复/终止/日志 |
| 7 | 效果仪表盘 | ✅ | Recharts 多维度 |
| 8 | 报表中心 + 导出 | ✅ | ExcelJS + pdfkit |
| 9 | 告警管理 | ✅ | BullMQ 5 分钟轮询,通知 + 历史 |
| 10 | 集成-CRM | ⚠️ mock | 路由 + service 骨架,需真联调 |
| 11 | 集成-权益 | ⚠️ mock | 同上 |
| 12 | 集成-渠道 | ⚠️ mock | 同上 |
| 13 | 集成-大数据 | ⚠️ 部分真 | **P0 修复**:settings 状态真实 health,**前端未消费大数据 API** |
| 14 | 合规智能体 + 脱敏 | ✅ | compliance + masking 模块完整 |
| 15 | 认证-用户名密码 | ✅ | bcrypt |
| 16 | 认证-LDAP/AD | ✅ | ldapService 完整 |
| 17 | **认证-短信验证码** | ✅ **(本轮新)** | 5min TTL / 60s 冷却 / 5 次尝试上限 / 失败显式 |
| 18 | RBAC 权限 | ✅ | users 路由 + settings PermissionManager |
| 19 | 脱敏 + 审计 | ✅ | masking + audit 模块 |
| 20 | 多模型 | ✅ | llm-gateway 双 provider(Gemini + OpenAI 兼容),**per-agent 绑定本轮落地** |
| 21 | Docker 容器化 | ✅ | docker-compose.yml + 3 Dockerfile |
| 22 | 非功能-性能 | ⚠️ 未测 | mock 模式存在;真环境需压测 |
| 23 | 非功能-可靠/备份/HTTPS | ❌ | 部署阶段再补 |
| 24 | DB 选型(PRD 2.2 vs 8.1 矛盾) | ✅ | 实际 PostgreSQL + Prisma,文档以现状为准 |

**功能层 17/17 全过**(本次新增:短信验证码)。
**集成层 4 项仍是 mock**(CRM/权益/渠道/大数据),部署前要真接。
**非功能 2 项缺失**,部署阶段动作。

---

## 4. P1 进度(优先级逐项)

| # | 项 | 状态 | 落库 |
|---|----|------|------|
| A | 场景 AI 四段链路 | ✅ | commit `7b2ff71` + `b4bf3a9` |
| B | 大数据前端接入 | ⏳ | 客群/评估模块仍走 mock |
| C | A/B 自动回流 | ⏳ | 转化靠人工录 |
| D | **短信验证码(验收硬项)** | ✅ | commit `f48b6d8` + `d3d0956` + `ccbc880` |

P1 四件里 A + D 完成;剩 B + C。

---

## 5. 卡住的项 / 风险

### ⚠️ 阻塞:CI workflow 文件不能直接 push

- 本地已写好 `.github/workflows/tests.yml`(76 行,3 个 job:frontend / data-service / agent-service)
- **OAuth token 缺 `workflow` scope**,GitHub 直接拒收
- **解锁方式(三选一)**:
  1. 在 GitHub 网页手贴文件(30 秒)— 内容见 `ci/workflow-needs-manual-push` 分支
  2. 用带 `workflow` scope 的 PAT 替换 token
  3. 临时跳过,本地 smoke test 当兜底
- **影响**:CI 跑不通,推送后无自动验证。短期可接受,中期必须有。

### 其他未完成

| 项 | 影响 | 谁来做 |
|---|------|--------|
| 部署前 `pnpm --filter data-service db:push` | OTP 登录失败 | 拿到 PG 后你跑 |
| 集成层(CRM/权益/渠道/大数据)真联调 | 上线硬骨头 | 后端 + 业务方 |
| 3 份 7-25 草稿文档(本份就是新版本) | 文档一致性 | 我已替换为 8-13 版 |
| `backend-dev` stale 分支 | git 卫生 | 5 分钟清掉 |
| `chore/ci-hygiene-docs` / `ci/workflow-needs-manual-push` 本地分支 | git 卫生 | 5 分钟清掉 |
| HTTPS / 99.9% / 备份 / 30min 恢复 | PRD 8.3 验收 | 部署阶段 |
| 外部 4 个集成(CRM/权益/渠道/大数据)的 mock → 真 | 上线硬骨头 | 业务方 + 后端 |

---

## 6. demo 能力(PM 直接拿去)

最值得演示的入口:**工厂页 AI 智能生成**(`/factory`)
- 输入自然语言 → 弹"客群洞察 / 客群圈选 / 内容生成 / 策略执行"四段预览卡(可折叠)
- 点「确认落库」→ 写入 `scenarios` 表 → 可触发后续执行
- LLM 失败时显式提示,可重试或切手动配置

其他可演示的:
- 6 个 AI agent(分别调 `/agents/{insight|segment|content|compliance|strategy|analyst}`)
- master 编排 `/agents/master` 或 SSE 流式 `/agents/master/stream`
- 短信登录(`/login` 切到"短信登录" tab,验证码在 data-service 控制台打)
- A/B 测试统计(pValue / 显著性 / 胜者,多分支正确)
- 大数据集成状态(settings 页真实 health,不通会显示 disconnected)

**部署后**:`docker-compose up` 起 PG/Redis + 3 服务 + 前端,跑通登录到场景生成的链路。

---

## 7. 今日累计(可写在 OKR/周报里)

- **17 commit** 落 main(2 天累计)
- **3 块功能** 完工(P0 三件套 + P1-A 场景 AI + P1-D 短信验证码 + per-agent 模型)
- **5 项基础设施** 落地(.gitignore / 测试 polyfill / CI / AGENTS / db 文档)
- **PRD 验收** 从 16/17 升到 **17/17**
- **代码变化**:+1754 / -334,跨 37 文件

---

## 8. 下一步建议(给 PM 拍板)

| 优先级 | 行动 | 工作量 | 影响 |
|--------|------|--------|------|
| P0 | 解锁 CI workflow(push 到远端) | 30 秒 | 推送即验,防回归 |
| P0 | 真部署一次,跑通登录到执行 | 半天 | demo / 验收 |
| P1 | P1-B 大数据前端接入 + mock server | 1.5 天 | 让客群/评估能跑真数据 |
| P1 | P1-C A/B 自动回流 | 1.5 天 | 评估智能体有源 |
| P2 | 外部 4 集成真联调 | 2-3 天 | 上线硬骨头 |
| P2 | 集成层非功能(HTTPS/备份) | 2-4 天 | 部署阶段 |
| P3 | 清本地 stale 分支 + 旧草稿 | 5 分钟 | 卫生 |

---

## 9. 关联文档

- `AGENTS.md` — 项目内 AI agent 协作手册(本轮同步过)
- `PRD-FinMark-AI-V1.0.md` — 原始 PRD(草稿)
- `V2增强计划_场景AI_AB_大数据.md` — V2 增强计划(P0/P1 阶段已落地大部分,仅作历史参考)
- `PRD差异对照_2026-07-25.md` — PRD vs 实现差异(7-25 快照,部分过期)
- `.github/workflows/tests.yml` — CI 配置(待 push)
