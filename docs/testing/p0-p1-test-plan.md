# P0+P1 功能测试计划

## 测试环境准备

### 1. 安装 Redis (P0 必需)
```bash
# macOS
brew install redis
brew services start redis

# 验证 Redis 运行
redis-cli ping
# 预期输出：PONG
```

### 2. 配置环境变量
```bash
cd finmark-backend/services/data-service
cp .env.example .env
# 确认 REDIS_URL=redis://localhost:6379
```

### 3. 启动后端服务
```bash
cd finmark-backend/services/data-service
pnpm dev
```

预期输出:
```
✅ Data Service running on http://localhost:3001
✅ Health check: http://localhost:3001/health
✅ Alarm queue initialized
✅ Alarm evaluation scheduled every 5 minutes
```

---

## P0 测试用例

### 1. 告警系统测试

#### 1.1 创建告警规则
```bash
curl -X POST http://localhost:3001/api/alarms/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "触达率过低",
    "metric": "reach_rate",
    "condition": "lt",
    "threshold": 50,
    "level": "warning",
    "channels": ["app_push", "sms"]
  }'
```
- [ ] 返回 201 状态码
- [ ] 返回创建的规则 (包含 id)
- [ ] 验证规则保存在数据库

#### 1.2 获取所有告警规则
```bash
curl http://localhost:3001/api/alarms/rules \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回规则列表
- [ ] 包含刚才创建的规则
- [ ] 包含 `_count.history` 字段

#### 1.3 手动触发告警评估
```bash
curl -X POST http://localhost:3001/api/alarms/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回成功消息
- [ ] 检查后端日志显示评估过程
- [ ] 如果有执行数据，应创建告警历史

#### 1.4 获取告警历史
```bash
curl http://localhost:3001/api/alarms/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回告警历史列表
- [ ] 包含触发的告警记录

#### 1.5 确认告警
```bash
curl -X POST http://localhost:3001/api/alarms/history/:id/acknowledge \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 告警状态变为 acknowledged
- [ ] acknowledgedAt 时间戳被设置

#### 1.6 删除告警规则
```bash
curl -X DELETE http://localhost:3001/api/alarms/rules/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回成功
- [ ] 规则从列表消失

---

### 2. 报表系统测试

#### 2.1 生成 PDF 报表
```bash
curl -X POST http://localhost:3001/api/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "3 月营销汇总",
    "type": "summary",
    "format": "pdf",
    "dateRange": {
      "start": "2026-03-01T00:00:00Z",
      "end": "2026-03-31T23:59:59Z"
    }
  }'
```
- [ ] 返回 201 状态码
- [ ] 返回报告记录 (status: pending)
- [ ] 后台开始生成 PDF

#### 2.2 等待生成完成
```bash
# 等待 5 秒后查询
curl http://localhost:3001/api/reports/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] status 变为 completed
- [ ] fileId 包含文件名
- [ ] generatedAt 有时间戳

#### 2.3 下载报告
```bash
curl -o report.pdf http://localhost:3001/api/reports/:id/download \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 下载 PDF 文件
- [ ] 文件可以打开
- [ ] 内容包含报表数据

#### 2.4 生成 Excel 报表
```bash
curl -X POST http://localhost:3001/api/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "3 月详细数据",
    "type": "scenario",
    "format": "excel",
    "dateRange": {
      "start": "2026-03-01T00:00:00Z",
      "end": "2026-03-31T23:59:59Z"
    }
  }'
```
- [ ] 返回 201 状态码
- [ ] 生成 Excel 文件

#### 2.5 下载 Excel 报表
```bash
curl -o report.xlsx http://localhost:3001/api/reports/:id/download \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 下载 XLSX 文件
- [ ] 可以用 Excel 打开
- [ ] 包含 Summary 和 Executions 两个工作表

---

## P1 测试用例

### 3. 工作流系统测试

#### 3.1 创建工作流
```bash
curl -X POST http://localhost:3001/api/expert/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "客户入职流程",
    "description": "新客户欢迎流程",
    "nodes": [
      {
        "id": "node1",
        "type": "trigger",
        "name": "新客户注册",
        "config": {}
      },
      {
        "id": "node2",
        "type": "action",
        "name": "发送欢迎邮件",
        "config": {
          "templateId": "welcome-email"
        }
      }
    ],
    "edges": [
      {
        "source": "node1",
        "target": "node2"
      }
    ]
  }'
```
- [ ] 返回 201 状态码
- [ ] 返回创建的工作流
- [ ] status 为 draft

#### 3.2 获取所有工作流
```bash
curl http://localhost:3001/api/expert/workflows \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回工作流列表
- [ ] 包含刚创建的工作流

#### 3.3 更新工作流
```bash
curl -X PUT http://localhost:3001/api/expert/workflows/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enabled": true,
    "status": "active"
  }'
```
- [ ] 返回更新后的工作流
- [ ] enabled 变为 true
- [ ] status 变为 active

#### 3.4 执行工作流
```bash
curl -X POST http://localhost:3001/api/expert/workflows/:id/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回 201 状态码
- [ ] 创建 execution 记录
- [ ] status 为 pending

#### 3.5 获取执行历史
```bash
curl http://localhost:3001/api/expert/workflows/executions/history?workflowId=:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回执行历史列表
- [ ] 包含刚才的执行记录

---

### 4. 模板系统测试

#### 4.1 创建模板
```bash
curl -X POST http://localhost:3001/api/expert/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "欢迎短信",
    "type": "sms",
    "content": "尊敬的{customerName}，欢迎您成为我行客户！我们将竭诚为您提供优质金融服务。",
    "variables": ["customerName"],
    "category": "客户欢迎",
    "description": "用于新客户开户后的欢迎短信"
  }'
```
- [ ] 返回 201 状态码
- [ ] 返回创建的模板
- [ ] usageCount 为 0

#### 4.2 获取所有模板
```bash
curl http://localhost:3001/api/expert/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回模板列表
- [ ] 按 usageCount 降序排列

#### 4.3 渲染模板
```bash
curl -X POST http://localhost:3001/api/expert/templates/:id/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "variables": {
      "customerName": "张三"
    }
  }'
```
- [ ] 返回渲染后的内容
- [ ] {customerName} 被替换为 "张三"
- [ ] usageCount 增加到 1

#### 4.4 复制模板
```bash
curl -X POST http://localhost:3001/api/expert/templates/:id/duplicate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "newName": "欢迎短信 - 副本"
  }'
```
- [ ] 返回新创建的模板
- [ ] name 为 "欢迎短信 - 副本"
- [ ] content 和 variables 与原模板相同
- [ ] isSystem 为 false

#### 4.5 更新模板
```bash
curl -X PUT http://localhost:3001/api/expert/templates/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "新的模板内容 {customerName}"
  }'
```
- [ ] 返回更新后的模板
- [ ] content 已更新

---

### 5. 批量策略测试

#### 5.1 创建批量操作
```bash
curl -X POST http://localhost:3001/api/expert/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "批量启用场景",
    "description": "启用所有获客期场景",
    "operations": [
      {
        "type": "scenario",
        "action": "enable",
        "data": {}
      }
    ],
    "targetIds": ["scenario-id-1", "scenario-id-2"]
  }'
```
- [ ] 返回 201 状态码
- [ ] 返回创建的批量操作
- [ ] status 为 pending

#### 5.2 执行批量操作
```bash
curl -X POST http://localhost:3001/api/expert/batch/:id/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回执行结果
- [ ] 所有目标场景被启用
- [ ] batch status 变为 completed
- [ ] result 包含执行详情

#### 5.3 获取批量状态
```bash
curl http://localhost:3001/api/expert/batch/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回批量操作详情
- [ ] status 为 completed
- [ ] executedAt 有时间戳

#### 5.4 取消待处理批量
```bash
# 先创建一个批量但不执行
curl -X POST http://localhost:3001/api/expert/batch \
  ...

# 然后取消
curl -X POST http://localhost:3001/api/expert/batch/:id/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] 返回取消后的状态
- [ ] status 变为 failed

---

## 测试结果记录

### P0 告警系统
- [ ] 1.1 创建告警规则 ✅ / ❌
- [ ] 1.2 获取告警规则 ✅ / ❌
- [ ] 1.3 触发评估 ✅ / ❌
- [ ] 1.4 获取历史 ✅ / ❌
- [ ] 1.5 确认告警 ✅ / ❌
- [ ] 1.6 删除规则 ✅ / ❌

### P0 报表系统
- [ ] 2.1 生成 PDF 报表 ✅ / ❌
- [ ] 2.2 等待生成 ✅ / ❌
- [ ] 2.3 下载 PDF ✅ / ❌
- [ ] 2.4 生成 Excel ✅ / ❌
- [ ] 2.5 下载 Excel ✅ / ❌

### P1 工作流系统
- [ ] 3.1 创建工作流 ✅ / ❌
- [ ] 3.2 获取工作流 ✅ / ❌
- [ ] 3.3 更新工作流 ✅ / ❌
- [ ] 3.4 执行工作流 ✅ / ❌
- [ ] 3.5 执行历史 ✅ / ❌

### P1 模板系统
- [ ] 4.1 创建模板 ✅ / ❌
- [ ] 4.2 获取模板 ✅ / ❌
- [ ] 4.3 渲染模板 ✅ / ❌
- [ ] 4.4 复制模板 ✅ / ❌
- [ ] 4.5 更新模板 ✅ / ❌

### P1 批量策略
- [ ] 5.1 创建批量 ✅ / ❌
- [ ] 5.2 执行批量 ✅ / ❌
- [ ] 5.3 获取状态 ✅ / ❌
- [ ] 5.4 取消批量 ✅ / ❌

---

## 问题记录

### 发现的问题
1. 
2. 
3. 

### 需要修复的 Bug
1. 
2. 
3. 

---

## 下一步行动

根据测试结果:
- 如果全部通过 → 开始 P2 系统集成
- 如果有失败 → 修复 Bug 后重新测试
- 如果有功能缺失 → 补充实现
