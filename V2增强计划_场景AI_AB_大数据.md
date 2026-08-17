# FinMark V2 增强迭代计划:场景 AI 生成 · A/B 测试 · 大数据平台

> 文档日期:2026-08-15(8-13 版基础上加 8-15 per-agent UI + A/B 事件回流)
> 关注三块"表面有、实际未真完成"的功能的真实状态。
> **结论先行**:**V2 计划 P0 + P1 全部完成**(8-12 ~ 8-15 共 4 天推进)。剩真接 + 部署阶段动作。

---

## 一、场景 AI 生成(自然语言 → 场景配置) ✅ P0 + P1-A 完工

### 当前状态(2026-08-15)

`POST /scenarios/generate` 端到端可用,四段 zod 严格校验,LMM 失败显式 errors,工厂页四段预览 + 确认落库流程。

### 落库 commits

| SHA | 内容 |
|-----|------|
| `28be231` | /generate 接通真实 llm-gateway |
| `b4bf3a9` | /generate 对齐 PRD 4.2 + zod 校验 |
| `7b2ff71` | 工厂页四段预览 + 确认落库 |
| + 11 个 scenarioAI 单测 | — |

### 验收对照(PRD 4.2)

| 段 | 字段 | 落库 |
|----|------|------|
| insightConfig | targetTags, analysisLogic | ✅ |
| segmentConfig | criteria, maxCount | ✅ |
| contentConfig | style, channels | ✅ |
| strategyConfig | path | ✅ |

### 仍欠(都是 P1 收尾以外的工作,非阻断)

- segmentConfig.criteria 真接大数据分群(目前是 LLM 生成的自然语言描述) → 留给真接工作
- strategyConfig.path 真接任务调度引擎(目前只是描述) → 留给真接工作

---

## 二、A/B 测试 ✅ P0 + P1-C 全部完工

### 当前状态(2026-08-15)

后端:
- ✅ `getResults` 修复 pValue 缺失(双尾 z 检验)
- ✅ 多分支对比(best vs rest-pooled)
- ✅ 分支 id+weight 规范化
- ✅ 路由 `/:id/conversions` 对齐
- ✅ **批量事件回流**:`POST /:id/events` 接受 firehose 投递(eventId 幂等 / dedup / reject 分项统计)

前端:
- 详情页正确显示 sampleSize/conversionCount
- pValue 卡片不崩
- **"批量触发" Dialog**:选 branch + source + 数量,4 象限结果展示

### 落库 commits

| SHA | 内容 |
|-----|------|
| `6dbd29d` | pValue 修复 / 多分支 / 路由对齐 |
| `b4102fd` | 批量事件回流 + 8 个单测 |

### 仍欠

- 渠道/大数据事件回推的"真实事件源"(目前是前端模拟按钮)
- 自动触发"达到显著性时停测试 + 通知评估智能体"的工作流
- 预留:**A/B 测试结果接入 ModelCallLog**,评估智能体可消费历史

---

## 三、大数据平台集成 ✅ P0 + P1-B 全部完工

### 当前状态(2026-08-15)

后端:
- ✅ `bigDataService.healthCheck()` 真实 GraphQL 探活
- ✅ settings 集成状态真实探测(bigdata / rights / channel)
- ✅ **新增 `bigdata-mock` 服务**:Apollo Server v4,确定性 mock 数据(5 个 query)
- ✅ **data-service `/api/bigdata/*` 4 个端点**做 proxy,前端能消费
- ✅ docker-compose 自动拉起 bigdata-mock

前端:
- ✅ `services/bigdata.ts` 4 方法类型化 wrapper
- ✅ **expert 页"大数据真实数据源"面板**:点按钮调真 GraphQL,显示 total + 样本

### 落库 commits

| SHA | 内容 |
|-----|------|
| `58be3a8` | healthCheck 真实探活 + settings 状态改真实 |
| `fe2c65f` | bigdata-mock 服务 + docker-compose + 默认 URL |
| `d3cfe60` | data-service proxy + 前端 wiring |
| `d4600fd` | tsc 修小 bug |

### 真接生产(部署阶段)

- 拿到行方大数据平台凭证后,设 `BIG_DATA_GRAPHQL_URL` 环境变量
- 关闭 bigdata-mock 服务(从 docker-compose 注释)
- 端到端流程不变

---

## 四、短信验证码(PRD 9.2 验收项,8-12 顺手做)

- `User` 表加 `phone` 字段 + migration + 部署 README
- `otpService` 内存实现(5min TTL / 60s 冷却 / 5 次尝试上限)
- `MockSmsProvider` 接口(控制台输出验证码,生产换阿里云/腾讯云)
- 路由 `/auth/otp/request` + `/auth/otp/verify`(COOLDOWN → 429)
- 登录页 Tabs 切换密码/短信
- 9 个单测覆盖所有边界

落库:`f48b6d8` / `d3d0956` / `ccbc880`

---

## 五、per-agent 模型绑定(PRD 8.2 验收项,8-13 + 8-15 完成)

### 后端(8-13)
- `agentConfigClient.ts`:5min TTL 内存缓存 + 启动 prefetch
- `BaseAgent.resolveModel()` 优先级:request body > 持久化 modelId > hardcoded 默认
- 6 个智能体(insight/segment/content/compliance/strategy/analyst)声明 agentType
- agent-service 补 vitest + 7 个单测

### 前端(8-15)
- `services/settings.ts` 加 `AgentConfig` / `AgentType` 类型 + `getAgentConfigs` / `updateAgentConfig`
- settings 页新"智能体" Tab:6 行 × 1 个 model 下拉,"使用默认"清空,改完即 PUT
- 副标题提示"修改后需重启 agent-service 才生效"

落库:`a0ea00a` / `d6e6fb7`

---

## 六、V2 计划收官状态(2026-08-15)

| 项 | 状态 | 阻塞 | 估计 |
|---|------|------|------|
| A. 场景 AI 四段 | ✅ | — | 已落 |
| B. 大数据前端接入 | ✅ | — | 已落(mock 可演示) |
| C. A/B 自动回流 | ✅ | — | 已落(前端模拟按钮演示) |
| D. 短信验证码 | ✅ | — | 已落 |

**V2 计划 4/4 全部完工**。下一步是部署试跑 + 真接 + 非功能。

---

## 七、关联

- `PROJECT_STATUS_2026-08-15.md` — 全项目现状(收官版)
- `PRD差异对照_2026-08-13.md` — PRD vs 实际差异
- `AGENTS.md` — 项目内 AI agent 协作手册
