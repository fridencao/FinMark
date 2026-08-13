# FinMark V2 增强迭代计划:场景 AI 生成 · A/B 测试 · 大数据平台

> 文档日期:2026-08-13(原 7-25 草稿已过期,本份是更新版)
> 关注三块"表面有、实际未真完成"的功能的真实状态。
> **结论先行**:**P0 全部完成 + P1-A 场景 AI + P1-D 短信已落库**;剩 P1-B(大数据前端接入)/ P1-C(A/B 自动回流)。

---

## 一、场景 AI 生成(自然语言 → 场景配置) ✅ P0 + P1-A 完工

### 当前状态(2026-08-13)

`POST /scenarios/generate` 现在端到端可用:
- 调用真实 `llm-gateway /v1/completions`(原 404 bug 已修)
- 严格 zod 校验四段(insight/segment/content/strategy)结构
- LLM 失败时返回 `{ valid:false, errors:[] }`,前端显式提示「AI 暂不可用」,**不再静默假数据**
- 工厂页接入四段预览卡(可折叠)→「确认落库」流程

### 落库 commits

| SHA | 内容 |
|-----|------|
| `28be231` | /generate 接通真实 llm-gateway |
| `b4bf3a9` | /generate 对齐 PRD 4.2 + zod 校验 |
| `7b2ff71` | 工厂页四段预览 + 确认落库 |
| `b4bf3a9` | scenarioAI 11 个单测 |

### 验收对照(PRD 4.2)

| 段 | 字段 | 落库 |
|----|------|------|
| insightConfig | targetTags, analysisLogic | ✅ |
| segmentConfig | criteria, maxCount | ✅ |
| contentConfig | style, channels | ✅ |
| strategyConfig | path | ✅ |

### 仍欠(都是 P1 收尾,非阻断)

- segmentConfig 的 `criteria` 真接大数据(目前是 LLM 生成的自然语言描述)
- strategyConfig 的 `path` 真接任务调度引擎(目前只是描述)
- 这两块属于 P1-B(大数据前端)的延伸

---

## 二、A/B 测试 ✅ P0 完成 / P1-C 部分欠

### 当前状态(2026-08-13)

后端:
- ✅ `getResults` 修复 pValue 缺失(双尾 z 检验)
- ✅ 多分支对比(best vs rest-pooled)替换原"只比前两个"
- ✅ 分支 id+weight 规范化(前端只传 name+traffic,后端补)
- ✅ 路由路径统一 `/:id/conversions`
- ⚠️ 转化数据仍靠 `recordConversion` 人工录

前端:
- 详情页正确显示 sampleSize/conversionCount
- pValue 卡片不崩了

### 落库 commits

| SHA | 内容 |
|-----|------|
| `6dbd29d` | pValue 修复 / 多分支 / 路由对齐 |
| abTestService.test.ts:25/25 测试 | — |

### 仍欠(P1-C 自动回流)

- 渠道/大数据事件 → 转化数自动累加
- 需要事件埋点(channel 调用 conversion-tracking 端点)
- 需要替代或并行人工录入入口(不能完全砍掉,后台手动补录仍要支持)
- **依赖**:P1-B(大数据接入)+ 渠道服务埋点
- **估计**:1.5 天

---

## 三、大数据平台集成 🟡 部分完成

### 当前状态(2026-08-13)

后端:
- ✅ `bigDataService.healthCheck()` 真实 GraphQL 探活
- ✅ `settings/integrations` 由硬编码 `connected` 改真实探测
- ✅ healthCheck 列入 `bigdata`(此前缺失)、rights、channel
- 4 个方法齐全(getCustomerSegment/getCustomerBehavior/searchSegmentCustomers/getAudiencePreview)

前端:
- ❌ **无任何消费代码**——客群/评估模块仍用 mock
- ❌ 大数据 API 没在前端 `services/` 暴露

### 落库 commits

| SHA | 内容 |
|-----|------|
| `58be3a8` | healthCheck 真实探活 + settings 状态改真实 |

### 仍欠(P1-B 大数据前端)

- 前端 `services/bigdata.ts` 暴露 4 个方法
- 客群筛选 UI 调用 `getAudiencePreview`
- 评估智能体接收大数据回流数据,替换 mock
- **依赖**:**没有真实 bigdata 端点时**,需要本地 mock GraphQL server(半天,放 docker-compose `bigdata-mock` 服务)
- **估计**:本地 mock + 前端接入 1.5 天

---

## 四、短信验证码(不在原 V2 计划里,8-12 顺手做了)

PRD 9.2 验收项,本轮直接做了:
- `User` 表加 `phone` 字段 + migration
- `otpService` 内存实现(5min TTL / 60s 冷却 / 5 次尝试上限)
- `MockSmsProvider` 接口
- 路由 `/auth/otp/request` + `/auth/otp/verify`(COOLDOWN → 429)
- 登录页 Tabs 切换密码/短信
- 9 个单测覆盖所有边界

落库:`f48b6d8` / `d3d0956` / `ccbc880`

---

## 五、per-agent 模型绑定(8-13 顺手做,PRD 8.2 验收项)

data-service 已有 `AgentConfig.modelId` 持久化,但 agent-service 没消费。本次补上:
- `agentConfigClient.ts`:5min TTL 内存缓存,启动 prefetch
- `BaseAgent.resolveModel()` 优先级:request body > 持久化 modelId > hardcoded 默认
- 6 个智能体(insight/segment/content/compliance/strategy/analyst)在 constructor 声明 agentType
- agent-service 补 vitest + 7 个单测

落库:`a0ea00a`

---

## 六、当前 P1 收尾进度(2026-08-13)

| 项 | 状态 | 阻塞 | 估计 |
|---|------|------|------|
| A. 场景 AI 四段 | ✅ 完成 | — | 已落 |
| B. 大数据前端接入 | ⏳ 未做 | 需 mock GraphQL server | 1.5 天 |
| C. A/B 自动回流 | ⏳ 未做 | 依赖 B | 1.5 天 |
| D. 短信验证码 | ✅ 完成 | — | 已落 |

---

## 七、下一步建议

1. **P1-B 优先**:配 mock GraphQL server + 前端接入(1.5 天),让"客群/评估"能跑真数据
2. **P1-C 串做**:B 完成后立刻接 C(A/B 自动回流)
3. **真接行方大数据**:走业务方申请流程,真联调;非本迭代范围

## 八、关联

- `PROJECT_STATUS_2026-08-13.md` — 全项目现状
- `PRD差异对照_2026-08-13.md` — PRD vs 实际差异(本份同步更新)
- `AGENTS.md` — 项目内 AI agent 协作手册
