# P1 Expert Mode Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Implement complete expert mode backend (workflow engine, template management, batch strategy, audience builder) to bring FinMark to 90% production readiness.

**Architecture:** 
- Workflow: Node-based visual orchestration stored in database, executed via BullMQ
- Templates: CRUD with variable substitution engine
- Batch Strategy: Bulk operations on multiple scenarios
- Audience Builder: Dynamic query builder with Prisma integration

**Tech Stack:** 
- Express.js + Prisma (existing)
- BullMQ (existing) - workflow execution
- JSON Schema validation
- Template engine (custom)

---

## File Structure

### New Files to Create:
- `finmark-backend/services/data-service/src/routes/expert.ts` — Expert mode unified router
- `finmark-backend/services/data-service/src/services/workflowService.ts` — Workflow CRUD + execution
- `finmark-backend/services/data-service/src/services/templateService.ts` — Template CRUD + render
- `finmark-backend/services/data-service/src/services/batchStrategyService.ts` — Batch operations
- `finmark-backend/services/data-service/src/services/audienceBuilderService.ts` — Query builder
- `finmark-backend/services/data-service/src/queues/workflowQueue.ts` — Workflow execution queue
- `finmark-backend/services/data-service/prisma/migrations/XXXX_add_expert_features/migration.sql` — Schema migrations

### Modified Files:
- `finmark-backend/services/data-service/prisma/schema.prisma` — Add Workflow, Template, BatchStrategy models
- `finmark-backend/services/data-service/src/index.ts` — Mount expert routes
- `finmark-backend/services/data-service/src/queues/alarmQueue.ts` — Reuse pattern for workflow queue
- `finmark-backend/services/data-service/package.json` — Add jsonschema dependency

### Test Files:
- `finmark-backend/services/data-service/tests/expert-workflow.test.ts`
- `finmark-backend/services/data-service/tests/expert-template.test.ts`

---

## Chunk 1: Database Schema + Models

### Task 1: Add Expert Mode Database Models

**Files:**
- Modify: `finmark-backend/services/data-service/prisma/schema.prisma`
- Create: `finmark-backend/services/data-service/prisma/migrations/20260320_add_expert_features/migration.sql`

- [ ] **Step 1: Add Prisma models to schema.prisma**

Add after `model Report`:

```prisma
// ==================== 专家模式 - 工作流 ====================

model Workflow {
  id          String   @id @default(uuid())
  name        String
  description String?
  nodes       Json     // Array of workflow nodes
  edges       Json     // Array of connections
  enabled     Boolean  @default(false)
  status      WorkflowStatus @default(draft)
  executions  WorkflowExecution[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("workflows")
}

model WorkflowExecution {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  status      ExecutionStatus @default(pending)
  context     Json?    // Execution context
  result      Json?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())

  @@map("workflow_executions")
}

enum WorkflowStatus {
  draft
  active
  paused
  archived
}

// ==================== 专家模式 - 模板 ====================

model Template {
  id          String   @id @default(uuid())
  name        String
  type        TemplateType
  category    String?
  content     String   // Template content with {variables}
  variables   String[] // List of variable names
  description String?
  isSystem    Boolean  @default(false)
  usageCount  Int      @default(0)
  status      TemplateStatus @default(active)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("templates")
}

enum TemplateType {
  sms
  email
  push
  wechat
  call
}

enum TemplateStatus {
  active
  inactive
  archived
}

// ==================== 专家模式 - 批量策略 ====================

model BatchStrategy {
  id          String   @id @default(uuid())
  name        String
  description String?
  operations  Json     // Array of batch operations
  targetIds   String[] // Scenario/template IDs to operate on
  status      BatchStatus @default(pending)
  result      Json?
  executedAt  DateTime?
  createdAt   DateTime @default(now())

  @@map("batch_strategies")
}

enum BatchStatus {
  pending
  processing
  completed
  failed
}
```

- [ ] **Step 2: Create migration SQL file**
- [ ] **Step 3: Run migration**
```bash
cd finmark-backend/services/data-service
npx prisma migrate dev --name add_expert_features
```
- [ ] **Step 4: Generate Prisma client**
```bash
npx prisma generate
```
- [ ] **Step 5: Commit**
```bash
git add finmark-backend/services/data-service/prisma/
git commit -m "feat: add Workflow, Template, BatchStrategy models for expert mode"
```

---

## Chunk 2: Workflow Engine

### Task 2: Create Workflow Queue

**Files:**
- Create: `finmark-backend/services/data-service/src/queues/workflowQueue.ts`

- [ ] **Step 1: Write test for workflow queue**
- [ ] **Step 2: Implement workflow queue**

Key features:
- Queue name: `'workflow-execution'`
- Process workflow nodes in order (or parallel when possible)
- Support node types: trigger, condition, action, delay
- Track execution progress in database

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

### Task 3: Create Workflow Service

**Files:**
- Create: `finmark-backend/services/data-service/src/services/workflowService.ts`

- [ ] **Step 1: Write tests**
- [ ] **Step 2: Implement workflow service**

Export functions:
- `getAllWorkflows()` - List workflows
- `getWorkflowById(id)` - Get workflow with executions
- `createWorkflow(data)` - Create new workflow
- `updateWorkflow(id, data)` - Update workflow
- `deleteWorkflow(id)` - Delete workflow
- `executeWorkflow(id)` - Trigger execution
- `getExecutionHistory(workflowId)` - Get execution history

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

---

## Chunk 3: Template Management

### Task 4: Create Template Service

**Files:**
- Create: `finmark-backend/services/data-service/src/services/templateService.ts`

- [ ] **Step 1: Write tests**
- [ ] **Step 2: Implement template service**

Export functions:
- `getAllTemplates(type?, category?)` - List templates
- `getTemplateById(id)` - Get template
- `createTemplate(data)` - Create template
- `updateTemplate(id, data)` - Update template
- `deleteTemplate(id)` - Delete template
- `renderTemplate(id, variables)` - Render with variable substitution
- `duplicateTemplate(id)` - Clone template

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

---

## Chunk 4: Batch Strategy + Audience Builder

### Task 5: Create Batch Strategy Service

**Files:**
- Create: `finmark-backend/services/data-service/src/services/batchStrategyService.ts`

- [ ] **Step 1: Write tests**
- [ ] **Step 2: Implement batch strategy service**

Export functions:
- `createBatchStrategy(data)` - Create batch operation
- `executeBatchStrategy(id)` - Execute batch
- `getBatchStatus(id)` - Get execution status
- `cancelBatchStrategy(id)` - Cancel pending batch

Operations supported:
- Bulk enable/disable scenarios
- Bulk update channels
- Bulk delete
- Bulk export

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

### Task 6: Create Audience Builder Service

**Files:**
- Create: `finmark-backend/services/data-service/src/services/audienceBuilderService.ts`

- [ ] **Step 1: Write tests**
- [ ] **Step 2: Implement audience builder service**

Export functions:
- `buildAudienceQuery(conditions)` - Build Prisma query from conditions
- `executeAudienceQuery(conditions)` - Execute and return count
- `getAudiencePreview(conditions, limit)` - Get sample customers
- `saveAudienceSegment(name, conditions)` - Save as reusable segment

Condition operators:
- Equality: =, !=
- Comparison: >, <, >=, <=
- Range: between
- Set: in, not_in
- String: contains, starts_with, ends_with

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

---

## Chunk 5: Expert Routes + Integration

### Task 7: Create Expert Routes

**Files:**
- Create: `finmark-backend/services/data-service/src/routes/expert.ts`

- [ ] **Step 1: Write route tests**
- [ ] **Step 2: Implement expert routes**

Routes:
```
/workflows/* - Workflow CRUD + execution
/templates/* - Template CRUD + render
/batch/* - Batch strategy operations
/audience/* - Audience builder operations
```

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

### Task 8: Mount Routes + Final Integration

**Files:**
- Modify: `finmark-backend/services/data-service/src/index.ts`

- [ ] **Step 1: Update index.ts**
- Import expertRouter
- Mount `/api/expert`
- Initialize workflow queue

- [ ] **Step 2: Test server startup**
```bash
cd finmark-backend/services/data-service
pnpm dev
```

- [ ] **Step 3: Commit**

---

## Chunk 6: Frontend Integration

### Task 9: Update Frontend API Services

**Files:**
- Create: `src/services/expert.ts`
- Modify: `src/app/expert/page.tsx`

- [ ] **Step 1: Create expert service**

Export:
- workflow CRUD functions
- template CRUD + render functions
- batch strategy functions
- audience builder functions

- [ ] **Step 2: Update expert page**
- Connect audience builder to real API
- Connect batch strategy to real API
- Connect template manager to real API
- Connect workflow builder to real API

- [ ] **Step 3: Test frontend integration**
```bash
cd /Users/xinjian/Work/Project/RD/FinMark
pnpm dev
```

- [ ] **Step 4: Commit**

---

## Completion Criteria

### ✅ Definition of Done

- [ ] All 9 tasks completed
- [ ] All tests passing
- [ ] Workflow engine can execute node-based workflows
- [ ] Template rendering works with variable substitution
- [ ] Batch operations execute successfully
- [ ] Audience builder generates correct Prisma queries
- [ ] Frontend expert page uses real APIs
- [ ] Documentation updated

### 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage | >75% | `pnpm test --coverage` |
| API Response Time | <300ms | Manual testing |
| Workflow Execution | <10s per node | Queue processing time |
| Template Render | <100ms | Render function timing |

---

## Estimated Duration: 1-2 weeks
## Risk Level: Medium (complex workflow logic)
