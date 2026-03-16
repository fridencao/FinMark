# FinMark AI 后端设计文档 V1.0

## 1. 技术栈

- Node.js + Express
- TypeScript
- better-sqlite3 (开发) / MySQL/PostgreSQL (生产)
- Google Generative AI SDK
- JWT 认证
- bcrypt 密码加密

## 2. 目录结构

```
backend/
├── src/
│   ├── index.ts              # 入口文件
│   ├── config/
│   │   └── database.ts       # 数据库配置
│   ├── middleware/
│   │   ├── auth.ts          # 认证中间件
│   │   └── error.ts         # 错误处理
│   ├── routes/
│   │   ├── index.ts         # 路由入口
│   │   ├── agent.ts        # 智能体路由
│   │   ├── scenario.ts      # 场景路由
│   │   ├── strategy.ts     # 策略路由
│   │   ├── performance.ts  # 效果路由
│   │   ├── settings.ts     # 设置路由
│   │   └── user.ts         # 用户路由
│   ├── services/
│   │   ├── agentService.ts
│   │   ├── scenarioService.ts
│   │   ├── strategyService.ts
│   │   ├── performanceService.ts
│   │   ├── integrationService.ts
│   │   └── llmService.ts    # 大模型服务
│   ├── models/              # 数据模型
│   └── types/              # 类型定义
├── package.json
└── tsconfig.json
```

## 3. API 接口设计

### 3.1 智能体 API (/api/agents)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /agents/insight | 洞察智能体 |
| POST | /agents/segment | 客群智能体 |
| POST | /agents/content | 内容智能体 |
| POST | /agents/compliance | 合规智能体 |
| POST | /agents/strategy | 策略智能体 |
| POST | /agents/evaluation | 评估智能体 |
| POST | /agents/master | 主智能体编排 |
| POST | /agents/:type/stream | 流式调用 |
| POST | /agents/copilot/chat | RM Copilot对话 |

### 3.2 场景 API (/api/scenarios)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /scenarios | 获取场景列表 |
| GET | /scenarios/defaults | 获取默认场景 |
| GET | /scenarios/categories | 获取分类 |
| GET | /scenarios/:id | 获取场景详情 |
| POST | /scenarios | 创建场景 |
| PUT | /scenarios/:id | 更新场景 |
| DELETE | /scenarios/:id | 删除场景 |
| POST | /scenarios/generate | AI生成场景 |
| POST | /scenarios/:id/execute | 执行场景 |

### 3.3 策略 API (/api)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /atoms | 获取策略原子列表 |
| POST | /atoms | 创建策略原子 |
| PUT | /atoms/:id | 更新策略原子 |
| DELETE | /atoms/:id | 删除策略原子 |
| GET | /abtests | 获取A/B测试列表 |
| POST | /abtests | 创建A/B测试 |
| POST | /abtests/:id/start | 启动A/B测试 |
| POST | /abtests/:id/stop | 停止A/B测试 |
| GET | /schedules | 获取任务列表 |
| POST | /schedules | 创建任务 |
| POST | /schedules/:id/pause | 暂停任务 |
| POST | /schedules/:id/resume | 恢复任务 |

### 3.4 效果 API (/api/performance)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /performance/dashboard | 仪表盘数据 |
| GET | /performance/trend | 趋势数据 |
| GET | /performance/charts | 图表数据 |
| GET | /performance/reports | 报表列表 |
| GET | /performance/reports/:id/export | 导出报表 |
| GET | /performance/alarms | 告警规则 |
| POST | /performance/alarms | 创建告警规则 |
| PATCH | /performance/alarms/:id/status | 更新告警状态 |

### 3.5 设置 API (/api/settings)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /settings/models | 获取模型列表 |
| POST | /settings/models | 添加模型 |
| PUT | /settings/models/:id | 更新模型 |
| DELETE | /settings/models/:id | 删除模型 |
| POST | /settings/models/:id/test | 测试模型 |
| GET | /settings/integrations | 获取集成列表 |
| PUT | /settings/integrations/:type | 更新集成配置 |
| POST | /settings/integrations/:type/test | 测试集成 |

### 3.6 用户 API (/api/users)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 获取用户列表 |
| GET | /users/me | 当前用户信息 |
| PUT | /users/me | 更新当前用户 |
| POST | /users/me/change-password | 修改密码 |
| GET | /users/:id | 获取用户详情 |
| POST | /users | 创建用户 |
| PUT | /users/:id | 更新用户 |
| DELETE | /users/:id | 删除用户 |
| GET | /users/roles | 获取角色列表 |

## 4. 大模型服务 (src/services/llmService.ts)

```typescript
class LLMService {
  // 通用生成
  async generate(prompt: string, system?: string): Promise<string>

  // 流式生成
  async *streamGenerate(agentType: AgentType, goal: string, context?: any): AsyncGenerator<string>

  // 构建智能体提示词
  private buildPrompt(agentType: AgentType, goal: string, context?: any): string

  // 测试连接
  async testConnection(): Promise<boolean>
}
```

## 5. 数据库模型

### 5.1 场景表 (scenarios)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | STRING | 场景名称 |
| description | TEXT | 场景描述 |
| category | ENUM | 分类（获客期/成长期/成熟期/衰退期/挽回期） |
| goal | STRING | 营销目标 |
| insightConfig | JSONB | 洞察配置 |
| segmentConfig | JSONB | 客群配置 |
| contentConfig | JSONB | 内容配置 |
| strategyConfig | JSONB | 策略配置 |
| isCustom | BOOLEAN | 是否自定义 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 5.2 策略原子表 (strategy_atoms)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | STRING | 原子名称 |
| type | ENUM | 类型（钩子/渠道/内容/风险） |
| description | TEXT | 描述 |
| successRate | FLOAT | 成功率 |
| usageCount | INTEGER | 使用次数 |
| tags | ARRAY | 标签 |
| config | JSONB | 配置参数 |
| scenarios | ARRAY | 适用场景 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 5.3 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | STRING | 用户名（唯一） |
| password | STRING | 密码 |
| name | STRING | 姓名 |
| email | STRING | 邮箱 |
| phone | STRING | 手机号 |
| role | ENUM | 角色（admin/manager/operator） |
| status | ENUM | 状态（enabled/disabled） |
| lastLogin | DATETIME | 最后登录时间 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 5.4 模型配置表 (model_configs)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | STRING | 模型名称 |
| type | ENUM | 类型（api/local） |
| apiUrl | STRING | API地址 |
| apiKey | STRING | API密钥 |
| modelVersion | STRING | 模型版本 |
| temperature | FLOAT | 温度参数 |
| maxTokens | INTEGER | 最大token数 |
| status | ENUM | 状态（enabled/disabled） |
| isDefault | BOOLEAN | 是否默认 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

## 6. 开发计划

| 阶段 | 任务 | 时间 |
|------|------|------|
| 一 | 基础搭建：项目初始化、数据库配置、中间件 | 1周 |
| 二 | 智能体服务：LLM服务、智能体编排逻辑 | 2周 |
| 三 | 场景服务：CRUD、AI生成、执行 | 1周 |
| 四 | 策略服务：原子库、A/B测试、任务调度 | 1周 |
| 五 | 效果服务：仪表盘、报表、告警 | 1周 |
| 六 | 设置服务：模型配置、系统集成、用户管理 | 1周 |
| 七 | 测试优化 | 1周 |
| **总计** | | **8周** |