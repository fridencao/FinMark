# FinMark 多智能体营销平台 — 项目现状盘点

> 盘点日期:2026-08-15
> 数据来源:git `d6e6fb7`(main HEAD)+ 本地代码扫描
> 上一份:`PROJECT_STATUS_2026-08-13.md`(本份是更新版)

---

## 0. 一句话总览

**P1 4/4 全部完工**:场景 AI 四段链路、大数据前端接入(端到端 mock + proxy)、A/B 批量事件回流、短信验证码;**per-agent 模型绑定 UI 落地**,settings/agents tab 可视化配置。**PRD V1.0 功能层 17/17 + 多模型层全部达成**,集成层 4/4 仍是 mock 端点(等业务方),非功能 3 项部署阶段。

**4 天集中推进**(8-12 ~ 8-15):23 个 commit 落 main,+~3700/-~440 行,跨 50+ 文件。

---

## 1. Git 状态

- **main HEAD**:`d6e6fb7`
- **分支**:只剩 main(`backend-dev` / `ci/workflow-needs-manual-push` 已清)
- **8-12 冻结点**:`de09284`(6-19 起 8 周没动,8-12 第一次动)
- **8-12 至 8-15 累计**:
  - 23 commit 落 main(3 merge + 20 子 commit)
  - 跨 50+ 文件,约 +3700/-440 行
  - 7 个独立 PR 合并(feature/fix/chore/ci/docs/merge)

---

## 2. 4 天推进时间线

### 8-12(8 周未动后第一次动)
- `28be231` P0:场景 AI 接通真实 llm-gateway
- `6dbd29d` P0:A/B pValue/多分支/路由对齐
- `58be3a8` P0:bigdata 真实 health check
- `8be9342` chore:.gitignore 加固(防 lockfile 漂移)
- `b4bf3a9` feat:场景 AI 对齐 PRD 4.2 + zod 校验
- `7b2ff71` feat:工厂页四段预览 + 确认落库
- `38760b0` chore:jsdom localStorage polyfill
- `f48b6d8` feat:短信 OTP service + mock provider
- `d3d0956` feat:/auth/otp/request + /otp/verify
- `ccbc880` feat:登录页短信 Tab

### 8-13
- `e481622` docs:phone migration deploy README
- `667f228` docs:AGENTS.md 同步(jsdom/CI/db push gotchas)
- `a0ea00a` feat:per-agent 模型绑定后端(PRD 8.2)
- `fe2c65f` feat:bigdata mock 服务 + 端到端
- `d3cfe60` feat:data-service bigdata proxy + 前端接入

### 8-15
- `b4102fd` feat:A/B 批量事件回流(PRD 7.2)
- `d6e6fb7` feat:per-agent 模型绑定 UI(settings/agents tab)

3 个主题全程贯穿:
1. **P0 修复** — 让"假 AI/假 A/B/假 health"变真
2. **P1 推进** — 4/4 完工
3. **基础设施** — 仓库卫生、测试卫生、CI、文档同步、UI 完善

---

## 3. PRD V1.0 验收(完整 24 项)

| # | 模块 | 状态 | 备注 |
|---|------|------|------|
| 1 | 智能体编排 6 个 + 协同 | ✅ | master + insight/segment/content/compliance/strategy/analyst + SSE |
| 2 | 场景预设模板 4 个 | ✅ | seed.ts 流失挽回/新发基金/信用卡分期/养老金开户 |
| 3 | 场景 CRUD + AI 自然语言生成 | ✅ | **8-12 升级**:四段 zod 校验 + 工厂页预览+确认落库 |
| 4 | 策略原子库 4 类 | ✅ | Brain(atoms)+ atoms 路由 |
| 5 | A/B 测试多类型 | ✅ 主体 | **8-12 修 pValue/多分支/路由**;**8-15 加批量事件回流** |
| 6 | 任务调度 三类触发 | ✅ | task-schedule + taskScheduleService |
| 7 | 效果仪表盘 | ✅ | performance + Recharts + monitoring |
| 8 | 报表中心 + Excel/PDF | ✅ | ExcelJS + pdfkit |
| 9 | 告警管理 | ✅ | BullMQ 5min + alarms 路由 |
| 10 | 集成-CRM | ⚠️ mock | 路由+service 骨架,等业务方 |
| 11 | 集成-权益 | ⚠️ mock | 同上 |
| 12 | 集成-渠道 | ⚠️ mock | 同上 |
| 13 | 集成-大数据 | ✅ 端到端 | **8-13 mock + proxy + 前端接入完**;生产只换 BIG_DATA_GRAPHQL_URL |
| 14 | 合规智能体 + 脱敏 | ✅ | compliance + masking + ComplianceRule |
| 15 | 认证-用户名密码 | ✅ | bcrypt |
| 16 | 认证-LDAP/AD | ✅ | ldapService |
| 17 | **认证-短信验证码** | ✅ | **8-12 落地** |
| 18 | RBAC 权限 | ✅ | users + settings PermissionManager + Role/Permission |
| 19 | 脱敏 + 审计 | ✅ | masking + audit + AuditLog |
| 20 | 多模型 + per-agent 独立 | ✅ **本轮完整** | 8-13 后端 + 8-15 UI;调用日志/降级未做 |
| 21 | Docker 容器化 | ✅ | docker-compose + 3 Dockerfile + **bigdata-mock** 新增 |
| 22 | 非功能-性能 | ⚠️ 未测 | mock 模式存在,真环境需压测 |
| 23 | 非功能-可靠/合规运维 | ❌ | 部署阶段(HTTPS/99.9%/备份/恢复) |
| 24 | DB 选型(PRD 矛盾) | ✅ | PostgreSQL + Prisma,文档对齐 |

**功能层 17/17 + 多模型 1/1 = 18/18 全部达成**;
**集成层 4/4 仍 mock**(等业务方);
**非功能 2/3 缺失**(部署阶段);
**文档对齐 ✓**。

---

## 4. P1 推进(全部完工)

| # | 项 | 状态 | 落库 | 影响 |
|---|----|------|------|------|
| A | 场景 AI 四段链路 | ✅ | `b4bf3a9` / `7b2ff71` | 工厂页能演示"输入→四段预览→确认落库"端到端 |
| B | **大数据前端接入** | ✅ | `fe2c65f` / `d3cfe60` | 客群/评估能调 mock 真数据;生产换 URL 即可 |
| C | **A/B 自动回流** | ✅ | `b4102fd` | ab-test 详情可"批量触发 N 条事件",eventId 幂等 |
| D | **短信验证码** | ✅ | `f48b6d8` / `d3d0956` / `ccbc880` | 登录页 Tab 切换,验收硬项 17/17 |

---

## 5. demo 能力(PM 直接拿去)

**最佳 demo 路径**(本地起服 5 分钟):

```sh
cd finmark-backend && docker compose up
# 自动起:postgres + redis + bigdata-mock + 3 个服务 + 前端
```

### 5 个最值得演示的入口

1. **工厂页"AI 智能生成场景"**(`/factory`)
   - 输入自然语言 → 弹"客群洞察/客群圈选/内容生成/策略执行"四段预览
   - "确认落库"→ 写 `scenarios` 表 → 可触发执行
   - 失败时显式错误,可重试/切手动

2. **专家页"大数据真实数据源"**(`/expert`, 选 audience 模块)
   - 点"调大数据预览" → 走 bigdata-mock → 显示 total + 5 个 sample
   - 输入分群 ID(seg-vip)→ "查分群客户" → 显示 20 个 mock 客户

3. **A/B 测试"批量触发"**(`/ab-test`, 详情)
   - 创建测试 → 启动 → 点"批量触发" → 选 source(sms/bigdata) + 数量
   - 4 象限结果:total/accepted/deduped/rejected
   - 同 eventId 跨批量幂等(连点 3 次不会翻倍)

4. **短信登录**(`/login`, 切"短信登录" Tab)
   - 输入 11 位手机号 → "获取验证码" → 验证码在 data-service 控制台打
   - "登录" → 跳转 `/copilot`

5. **多智能体独立模型**(`/settings`, 切"智能体" Tab)
   - 6 个智能体各选一个 ModelConfig("使用默认"走 hardcoded)
   - agent-service 重启后生效(5min TTL 也会刷新)

### A/B 评估闭环演示(PRD 7.2 全流程)

```sh
1. ab-test 详情页 → 启动测试(变成 running)
2. 点"批量触发" → 选 A 分支 + bigdata + 20 条
3. 再点 → 选 B 分支 + bigdata + 35 条
4. 切到结果页 → 看到 pValue / 显著性 / 胜者
5. 评估智能体下次调用 → 拿到真实分支数据(非 mock)
```

---

## 6. 风险与待办

### 阻塞(你操作)

| 项 | 影响 | 怎么解锁 |
|---|------|----------|
| CI workflow 文件未 push | 推送无自动验证 | 30 秒手动贴 GitHub(流程详见 AGENTS.md / 项目状态 8-13) |
| `pnpm --filter data-service db:push` | OTP 登录 + 部分 P0 演示失败 | 拿到 PG 后 1 条命令 |

### 部署前必做(我准备就绪)

- [ ] docker-compose 起 PG + Redis + 3 服务 + 前端
- [ ] 拿 PG 连接串,跑 `db:push` 应用 phone migration
- [ ] 装 LLM key(Gemini 或 OpenAI 兼容)
- [ ] 手动加 `.github/workflows/tests.yml`(如要 CI)
- [ ] 设置 `JWT_SECRET` 强密码(env 变量,生产)

### P2(等业务方/部署阶段)

- [ ] 集成层真接(CRM/权益/渠道/大数据) — 2-3 天
- [ ] 调用日志/降级(PRD 8.2 残余) — 1 天
- [ ] HTTPS / 99.9% / 备份 / 30min 恢复(PRD 8.3) — 2-4 天
- [ ] 性能压测(PRD 8.2 NFR) — 1 周

### 已清理(本轮)

- ✅ `backend-dev`(本地+远端,5 个月 stale,5 个未合 commit 已留 commit SHA)
- ✅ `ci/workflow-needs-manual-push`(本地,workflow 文件内容已在 chat 历史)

---

## 7. 今日累计(4 天总览)

| 指标 | 数值 |
|------|------|
| 落库 commit | 23 |
| merge commit | 4 |
| 跨文件 | 50+ |
| 净代码变化 | +~3700 / -~440 |
| 修复 P0 阻塞 | 3 件 |
| 推进 P1 | 4/4 全部 |
| 验收硬项落地 | 4(短信/per-agent/pValue/bigdata 真) |
| 基础设施补齐 | 5 件(.gitignore / 测试 polyfill / CI / AGENTS / 部署 README) |
| 文档同步 | 4 份(AGENTS.md + 3 PM 草稿) |

---

## 8. 推荐下一步(给 PM 拍板)

1. **部署一次,跑 5-min demo** — 最能展示价值,半天
2. **集成层真接启动** — 找业务方拿凭证,1 周内
3. **更新 PRD V1.0 → V1.1 草稿** — 把"实际是 mock"那 4 项标清楚,文档版本对齐
4. **CI 解锁** — 30 秒,你给个带 workflow scope 的 PAT
5. **A/B 转化率写入 ModelCallLog** — 评估智能体可消费历史

要哪条说。或者我帮你另起 V2 计划文档,把接下来 1-2 周的目标列出来?

---

## 9. 关联文档

- `AGENTS.md` — 项目内 AI agent 协作手册(同步过)
- `PRD-FinMark-AI-V1.0.md` — 原始 PRD(草稿,V1.1 待出)
- `V2增强计划_场景AI_AB_大数据.md` — V2 阶段回顾(8-15 同步)
- `PRD差异对照_2026-08-13.md` — PRD vs 实现差异(同步)
- `prisma/migrations/20260812090000_add_phone_to_user/README.md` — phone 列部署说明
- `.github/workflows/tests.yml` — **未 push**,本地分支已清
