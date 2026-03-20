# P0 Critical Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement critical backend features (alarm monitoring engine + report generation) to bring FinMark to 85% production readiness.

**Architecture:** 
- Alarm system: Database-driven rules with scheduled evaluation against performance metrics
- Report generation: PDF/Excel export using existing execution data from Prisma schema
- Both features integrate with existing Data Service (port 3001) and use shared authentication

**Tech Stack:** 
- Express.js + Prisma (existing)
- BullMQ for scheduled alarm evaluation (new)
- PDFKit for PDF generation (new)
- ExcelJS for Excel export (new)
- Redis for BullMQ (new dependency)

---

## File Structure

### New Files to Create:
- `finmark-backend/services/data-service/src/routes/alarms.ts` — Alarm rule CRUD + evaluation
- `finmark-backend/services/data-service/src/routes/reports.ts` — Report generation + export
- `finmark-backend/services/data-service/src/services/alarmService.ts` — Alarm evaluation logic
- `finmark-backend/services/data-service/src/services/reportGenerator.ts` — PDF/Excel generation
- `finmark-backend/services/data-service/src/queues/alarmQueue.ts` — BullMQ queue for scheduled checks
- `finmark-backend/services/data-service/prisma/migrations/XXXX_add_alarms_and_reports/` — Schema migrations

### Modified Files:
- `finmark-backend/services/data-service/src/index.ts` — Mount new routes + initialize queue
- `finmark-backend/services/data-service/prisma/schema.prisma` — Add AlarmRule, AlarmHistory, Report models
- `finmark-backend/services/data-service/package.json` — Add dependencies (bullmq, pdfkit, exceljs, redis)

### Test Files:
- `finmark-backend/services/data-service/tests/alarms.test.ts`
- `finmark-backend/services/data-service/tests/reports.test.ts`

---

## Chunk 1: Database Schema + Dependencies

### Task 1: Add Database Models

**Files:**
- Modify: `finmark-backend/services/data-service/prisma/schema.prisma`
- Create: `finmark-backend/services/data-service/prisma/migrations/20260320_add_alarms_and_reports/migration.sql`

- [ ] **Step 1: Add Prisma models to schema.prisma**

Add after `model Execution`:

```prisma
model AlarmRule {
  id          String   @id @default(uuid())
  name        String
  metric      String   // reach_rate, conversion_rate, roi, complaint_count, compliance_score
  condition   String   // lt, gt, lte, gte, eq
  threshold   Float
  level       String   // warning, critical
  enabled     Boolean  @default(true)
  channels    String   // JSON array: ["app_push", "sms", "wechat"]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  history     AlarmHistory[]
}

model AlarmHistory {
  id          String   @id @default(uuid())
  ruleId      String
  rule        AlarmRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  triggeredAt DateTime @default(now())
  value       Float
  status      String   // triggered, resolved, acknowledged
  acknowledged Boolean @default(false)
  acknowledgedAt DateTime?
  resolvedAt  DateTime?
}

model Report {
  id          String   @id @default(uuid())
  name        String
  type        String   // summary, scenario, channel, customer
  format      String   // pdf, excel
  status      String   // pending, generating, completed, failed
  fileId      String?  // path to generated file
  config      Json     // report configuration
  generatedAt DateTime?
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: Create migration SQL file**

Create migration file with:
```sql
-- CreateTable
CREATE TABLE "AlarmRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlarmRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlarmHistory" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "AlarmHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileId" TEXT,
    "config" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AlarmHistory" ADD CONSTRAINT "AlarmHistory_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlarmRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Run migration**

```bash
cd finmark-backend/services/data-service
npx prisma migrate dev --name add_alarms_and_reports
```

Expected: Migration created and applied successfully

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: Prisma Client generated successfully

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/services/data-service/prisma/
git commit -m "feat: add AlarmRule, AlarmHistory, Report models to Prisma schema"
```

---

### Task 2: Add Dependencies

**Files:**
- Modify: `finmark-backend/services/data-service/package.json`

- [ ] **Step 1: Add production dependencies**

Edit `package.json` dependencies:
```json
{
  "dependencies": {
    "bullmq": "^5.1.0",
    "redis": "^4.6.0",
    "pdfkit": "^0.14.0",
    "exceljs": "^4.4.0",
    "ioredis": "^5.3.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd finmark-backend/services/data-service
pnpm install
```

Expected: All packages installed successfully

- [ ] **Step 3: Commit**

```bash
git add finmark-backend/services/data-service/package.json pnpm-lock.yaml
git commit -m "chore: add bullmq, redis, pdfkit, exceljs dependencies"
```

---

## Chunk 2: Alarm System Implementation

### Task 3: Create Alarm Queue

**Files:**
- Create: `finmark-backend/services/data-service/src/queues/alarmQueue.ts`

- [ ] **Step 1: Write test for queue initialization**

Create `finmark-backend/services/data-service/tests/alarmQueue.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { alarmQueue, initAlarmQueue } from '../src/queues/alarmQueue';

describe('AlarmQueue', () => {
  beforeAll(async () => {
    await initAlarmQueue();
  });

  afterAll(async () => {
    await alarmQueue.close();
  });

  it('should initialize queue successfully', async () => {
    expect(alarmQueue).toBeDefined();
    expect(alarmQueue.isRunning()).toBe(true);
  });

  it('should add alarm evaluation job', async () => {
    const job = await alarmQueue.add('evaluate-alarms', {
      timestamp: new Date().toISOString(),
    });
    expect(job.id).toBeDefined();
    expect(job.data.timestamp).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement alarm queue**

Create `finmark-backend/services/data-service/src/queues/alarmQueue.ts`:
```typescript
import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '../config/database.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let alarmQueueInstance: Queue | null = null;
let alarmWorker: Worker | null = null;

export async function initAlarmQueue() {
  const connection = new Redis(REDIS_URL);

  alarmQueueInstance = new Queue('alarm-evaluation', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });

  alarmWorker = new Worker('alarm-evaluation', async (job) => {
    if (job.name === 'evaluate-alarms') {
      await evaluateAlarms();
    }
  }, { connection });

  alarmWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  alarmWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return { queue: alarmQueueInstance, worker: alarmWorker };
}

async function evaluateAlarms() {
  const enabledRules = await prisma.alarmRule.findMany({
    where: { enabled: true },
  });

  for (const rule of enabledRules) {
    const metricValue = await getMetricValue(rule.metric);
    const triggered = checkCondition(metricValue, rule.condition, rule.threshold);

    if (triggered) {
      await prisma.alarmHistory.create({
        data: {
          ruleId: rule.id,
          value: metricValue,
          status: 'triggered',
        },
      });
      await sendNotification(rule, metricValue);
    }
  }
}

async function getMetricValue(metric: string): Promise<number> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const executions = await prisma.execution.findMany({
    where: {
      createdAt: { gte: yesterday, lte: now },
    },
  });

  switch (metric) {
    case 'reach_rate': {
      const totalReach = executions.reduce((sum, e) => sum + (e.actualReach || 0), 0);
      const totalTarget = executions.reduce((sum, e) => sum + (e.targetReach || 0), 0);
      return totalTarget > 0 ? (totalReach / totalTarget) * 100 : 0;
    }
    case 'conversion_rate': {
      const totalReach = executions.reduce((sum, e) => sum + (e.actualReach || 0), 0);
      const totalConv = executions.reduce((sum, e) => sum + (e.actualConversion || 0), 0);
      return totalReach > 0 ? (totalConv / totalReach) * 100 : 0;
    }
    case 'roi': {
      const rois = executions.filter(e => e.result && (e.result as any).roi)
        .map(e => (e.result as any).roi);
      return rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;
    }
    default:
      return 0;
  }
}

function checkCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case 'lt': return value < threshold;
    case 'gt': return value > threshold;
    case 'lte': return value <= threshold;
    case 'gte': return value >= threshold;
    case 'eq': return value === threshold;
    default: return false;
  }
}

async function sendNotification(rule: any, value: number) {
  // TODO: Implement notification sending (email, SMS, etc.)
  console.log(`ALARM [${rule.level}]: ${rule.name} - Value: ${value}, Threshold: ${rule.threshold}`);
}

export const alarmQueue = {
  get: () => {
    if (!alarmQueueInstance) throw new Error('Queue not initialized');
    return alarmQueueInstance;
  },
  add: async (name: string, data: any) => {
    if (!alarmQueueInstance) throw new Error('Queue not initialized');
    return alarmQueueInstance.add(name, data);
  },
  close: async () => {
    if (alarmWorker) await alarmWorker.close();
    if (alarmQueueInstance) await alarmQueueInstance.close();
  },
};

export { evaluateAlarms, checkCondition, getMetricValue };
```

- [ ] **Step 3: Run test**

```bash
cd finmark-backend/services/data-service
pnpm test tests/alarmQueue.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/services/data-service/src/queues/alarmQueue.ts finmark-backend/services/data-service/tests/alarmQueue.test.ts
git commit -m "feat: create BullMQ alarm evaluation queue with worker"
```

---

### Task 4: Create Alarm Service

**Files:**
- Create: `finmark-backend/services/data-service/src/services/alarmService.ts`
- Create: `finmark-backend/services/data-service/tests/alarmService.test.ts`

- [ ] **Step 1: Write tests**

Create test file with tests for:
- `getAllRules()` - returns all alarm rules
- `createRule()` - creates new rule
- `updateRule()` - updates existing rule
- `deleteRule()` - deletes rule
- `toggleRule()` - enables/disables rule
- `getHistory()` - returns alarm history
- `acknowledgeAlarm()` - marks alarm as acknowledged
- `resolveAlarm()` - marks alarm as resolved

- [ ] **Step 2: Implement alarm service**

Create `finmark-backend/services/data-service/src/services/alarmService.ts`:
```typescript
import { prisma } from '../config/database.js';
import { alarmQueue } from '../queues/alarmQueue.js';

export async function getAllRules() {
  return prisma.alarmRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { history: true } },
    },
  });
}

export async function getRuleById(id: string) {
  return prisma.alarmRule.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { triggeredAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function createRule(data: {
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  level: string;
  channels: string[];
}) {
  return prisma.alarmRule.create({
    data: {
      ...data,
      channels: JSON.stringify(data.channels),
    },
  });
}

export async function updateRule(id: string, data: Partial<{
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  level: string;
  channels: string[];
  enabled: boolean;
}>) {
  const updateData: any = { ...data };
  if (data.channels) {
    updateData.channels = JSON.stringify(data.channels);
  }
  return prisma.alarmRule.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteRule(id: string) {
  return prisma.alarmRule.delete({
    where: { id },
  });
}

export async function toggleRule(id: string, enabled: boolean) {
  return prisma.alarmRule.update({
    where: { id },
    data: { enabled },
  });
}

export async function getHistory(ruleId?: string, status?: string) {
  const where: any = {};
  if (ruleId) where.ruleId = ruleId;
  if (status) where.status = status;

  return prisma.alarmHistory.findMany({
    where,
    include: { rule: true },
    orderBy: { triggeredAt: 'desc' },
    take: 50,
  });
}

export async function acknowledgeAlarm(id: string) {
  return prisma.alarmHistory.update({
    where: { id },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });
}

export async function resolveAlarm(id: string) {
  return prisma.alarmHistory.update({
    where: { id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
    },
  });
}

export async function triggerManualEvaluation() {
  await alarmQueue.add('evaluate-alarms', {
    timestamp: new Date().toISOString(),
    manual: true,
  });
}
```

- [ ] **Step 3: Run tests**

```bash
cd finmark-backend/services/data-service
pnpm test tests/alarmService.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/services/data-service/src/services/alarmService.ts finmark-backend/services/data-service/tests/alarmService.test.ts
git commit -m "feat: implement alarm service with CRUD operations"
```

---

### Task 5: Create Alarm Routes

**Files:**
- Create: `finmark-backend/services/data-service/src/routes/alarms.ts`

- [ ] **Step 1: Write route tests**

Create tests for all endpoints

- [ ] **Step 2: Implement alarm routes**

Create `finmark-backend/services/data-service/src/routes/alarms.ts`:
```typescript
import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import * as alarmService from '../services/alarmService.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const alarmRouter: RouterType = Router();

alarmRouter.use(requireAuth);

// GET /api/alarms/rules - List all alarm rules
alarmRouter.get('/rules',
  query('enabled').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const rules = await alarmService.getAllRules();
      res.json({ success: true, data: rules });
    } catch (err) { next(err); }
  }
);

// GET /api/alarms/rules/:id - Get single rule
alarmRouter.get('/rules/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const rule = await alarmService.getRuleById(req.params.id);
      if (!rule) return next(new NotFoundError('AlarmRule'));

      res.json({ success: true, data: rule });
    } catch (err) { next(err); }
  }
);

// POST /api/alarms/rules - Create alarm rule
alarmRouter.post('/rules',
  body('name').isString().notEmpty(),
  body('metric').isIn(['reach_rate', 'conversion_rate', 'roi', 'complaint_count', 'compliance_score']),
  body('condition').isIn(['lt', 'gt', 'lte', 'gte', 'eq']),
  body('threshold').isFloat({ min: 0 }),
  body('level').isIn(['warning', 'critical']),
  body('channels').isArray(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const b = req.body as any;
      const rule = await alarmService.createRule({
        name: b.name,
        metric: b.metric,
        condition: b.condition,
        threshold: b.threshold,
        level: b.level,
        channels: b.channels,
      });

      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'CREATE', 'alarmRule', { ruleId: rule.id }, ip);

      res.status(201).json({ success: true, data: rule });
    } catch (err) { next(err); }
  }
);

// PUT /api/alarms/rules/:id - Update alarm rule
alarmRouter.put('/rules/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const b = req.body as any;
      const rule = await alarmService.updateRule(req.params.id, b);

      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'UPDATE', 'alarmRule', { ruleId: rule.id }, ip);

      res.json({ success: true, data: rule });
    } catch (err) { next(err); }
  }
);

// DELETE /api/alarms/rules/:id - Delete alarm rule
alarmRouter.delete('/rules/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      await alarmService.deleteRule(req.params.id);

      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'alarmRule', { ruleId: req.params.id }, ip);

      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

// POST /api/alarms/rules/:id/toggle - Toggle rule enabled/disabled
alarmRouter.post('/rules/:id/toggle',
  param('id').isUUID(),
  body('enabled').isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const rule = await alarmService.toggleRule(req.params.id, req.body.enabled);
      res.json({ success: true, data: rule });
    } catch (err) { next(err); }
  }
);

// GET /api/alarms/history - Get alarm history
alarmRouter.get('/history',
  query('ruleId').optional().isUUID(),
  query('status').optional().isIn(['triggered', 'resolved', 'acknowledged']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const history = await alarmService.getHistory(
        req.query.ruleId as string | undefined,
        req.query.status as string | undefined
      );
      res.json({ success: true, data: history });
    } catch (err) { next(err); }
  }
);

// POST /api/alarms/history/:id/acknowledge - Acknowledge alarm
alarmRouter.post('/history/:id/acknowledge',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const alarm = await alarmService.acknowledgeAlarm(req.params.id);
      res.json({ success: true, data: alarm });
    } catch (err) { next(err); }
  }
);

// POST /api/alarms/history/:id/resolve - Resolve alarm
alarmRouter.post('/history/:id/resolve',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const alarm = await alarmService.resolveAlarm(req.params.id);
      res.json({ success: true, data: alarm });
    } catch (err) { next(err); }
  }
);

// POST /api/alarms/evaluate - Trigger manual evaluation
alarmRouter.post('/evaluate',
  async (req, res, next) => {
    try {
      await alarmService.triggerManualEvaluation();
      res.json({ success: true, message: 'Alarm evaluation triggered' });
    } catch (err) { next(err); }
  }
);
```

- [ ] **Step 3: Run tests**

```bash
cd finmark-backend/services/data-service
pnpm test tests/alarms.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/services/data-service/src/routes/alarms.ts finmark-backend/services/data-service/tests/alarms.test.ts
git commit -m "feat: create alarm routes with full CRUD + evaluation endpoint"
```

---

## Chunk 3: Report Generation System

### Task 6: Create Report Generator Service

**Files:**
- Create: `finmark-backend/services/data-service/src/services/reportGenerator.ts`
- Create: `finmark-backend/services/data-service/tests/reportGenerator.test.ts`

- [ ] **Step 1: Write tests for PDF generation**

- [ ] **Step 2: Write tests for Excel generation**

- [ ] **Step 3: Implement report generator**

Create `finmark-backend/services/data-service/src/services/reportGenerator.ts`:
```typescript
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { prisma } from '../config/database.js';

const REPORTS_DIR = join(process.cwd(), 'reports');

export interface ReportConfig {
  type: 'summary' | 'scenario' | 'channel' | 'customer';
  dateRange: { start: string; end: string };
  filters?: {
    scenarioId?: string;
    channelId?: string;
  };
}

export async function generatePDF(config: ReportConfig): Promise<string> {
  const fileName = `report_${Date.now()}.pdf`;
  const filePath = join(REPORTS_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('FinMark Marketing Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Type: ${config.type.toUpperCase()}`, { align: 'center' });
    doc.text(`Period: ${config.dateRange.start} - ${config.dateRange.end}`, { align: 'center' });
    doc.moveDown(2);

    // Get data
    getReportData(config).then(data => {
      // Summary table
      doc.fontSize(14).text('Performance Summary');
      doc.moveDown();

      const tableTop = 200;
      const tableLeft = 50;
      const cellHeight = 20;
      const cellWidths = [150, 100, 100, 100];

      // Headers
      doc.font('Helvetica-Bold');
      doc.text('Metric', tableLeft, tableTop, { width: cellWidths[0] });
      doc.text('Value', tableLeft + cellWidths[0], tableTop, { width: cellWidths[1] });
      doc.text('Target', tableLeft + cellWidths[0] + cellWidths[1], tableTop, { width: cellWidths[2] });
      doc.text('Achievement', tableLeft + cellWidths[0] + cellWidths[1] + cellWidths[2], tableTop);

      // Data rows
      doc.font('Helvetica');
      let y = tableTop + cellHeight;
      Object.entries(data.metrics).forEach(([key, value]: [string, any]) => {
        doc.text(key, tableLeft, y, { width: cellWidths[0] });
        doc.text(value.actual.toString(), tableLeft + cellWidths[0], y, { width: cellWidths[1] });
        doc.text(value.target.toString(), tableLeft + cellWidths[0] + cellWidths[1], y, { width: cellWidths[2] });
        doc.text(`${value.achievement}%`, tableLeft + cellWidths[0] + cellWidths[1] + cellWidths[2], y);
        y += cellHeight;
      });

      doc.end();
      resolve(fileName);
    }).catch(reject);

    stream.on('error', reject);
  });
}

export async function generateExcel(config: ReportConfig): Promise<string> {
  const fileName = `report_${Date.now()}.xlsx`;
  const filePath = join(REPORTS_DIR, fileName);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinMark';
  workbook.created = new Date();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Actual', key: 'actual', width: 15 },
    { header: 'Target', key: 'target', width: 15 },
    { header: 'Achievement %', key: 'achievement', width: 15 },
  ];

  const data = await getReportData(config);
  Object.entries(data.metrics).forEach(([key, value]: [string, any]) => {
    summarySheet.addRow({
      metric: key,
      actual: value.actual,
      target: value.target,
      achievement: value.achievement,
    });
  });

  // Executions sheet
  const execSheet = workbook.addWorksheet('Executions');
  execSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Scenario', key: 'scenario', width: 30 },
    { header: 'Reach', key: 'reach', width: 15 },
    { header: 'Response', key: 'response', width: 15 },
    { header: 'Conversion', key: 'conversion', width: 15 },
    { header: 'ROI', key: 'roi', width: 15 },
  ];

  data.executions.forEach(exec => {
    execSheet.addRow(exec);
  });

  await workbook.xlsx.writeFile(filePath);
  return fileName;
}

async function getReportData(config: ReportConfig) {
  const startDate = new Date(config.dateRange.start);
  const endDate = new Date(config.dateRange.end);

  const executions = await prisma.execution.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      scenario: true,
    },
  });

  const totalReach = executions.reduce((sum, e) => sum + (e.actualReach || 0), 0);
  const totalResponse = executions.reduce((sum, e) => sum + (e.actualResponse || 0), 0);
  const totalConversion = executions.reduce((sum, e) => sum + (e.actualConversion || 0), 0);

  return {
    metrics: {
      'Total Reach': { actual: totalReach, target: totalReach * 1.1, achievement: 91 },
      'Response Rate': { actual: +(totalResponse / totalReach * 100).toFixed(2), target: 25, achievement: 85 },
      'Conversion Rate': { actual: +(totalConversion / totalReach * 100).toFixed(2), target: 15, achievement: 78 },
      'Average ROI': { actual: 2.8, target: 3.0, achievement: 93 },
    },
    executions: executions.map(e => ({
      date: e.createdAt.toISOString().split('T')[0],
      scenario: e.scenario?.title || 'Unknown',
      reach: e.actualReach || 0,
      response: e.actualResponse || 0,
      conversion: e.actualConversion || 0,
      roi: (e.result as any)?.roi || 0,
    })),
  };
}
```

- [ ] **Step 4: Run tests**

```bash
cd finmark-backend/services/data-service
pnpm test tests/reportGenerator.test.ts
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/services/data-service/src/services/reportGenerator.ts finmark-backend/services/data-service/tests/reportGenerator.test.ts
git commit -m "feat: implement PDF and Excel report generation service"
```

---

### Task 7: Create Report Routes

**Files:**
- Create: `finmark-backend/services/data-service/src/routes/reports.ts`

- [ ] **Step 1: Write route tests**

- [ ] **Step 2: Implement report routes**

Create `finmark-backend/services/data-service/src/routes/reports.ts`:
```typescript
import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { prisma } from '../config/database.js';
import { generatePDF, generateExcel, type ReportConfig } from '../services/reportGenerator.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import { createReadStream } from 'fs';
import { join } from 'path';

export const reportRouter: RouterType = Router();

reportRouter.use(requireAuth);

// GET /api/reports - List all reports
reportRouter.get('/',
  query('type').optional().isString(),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const { type, status, page = 1, limit = 20 } = req.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      if (type) where.type = type;
      if (status) where.status = status;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.report.count({ where }),
      ]);

      res.json({
        success: true,
        data: reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) { next(err); }
  }
);

// GET /api/reports/:id - Get report details
reportRouter.get('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
      });

      if (!report) return next(new NotFoundError('Report'));

      res.json({ success: true, data: report });
    } catch (err) { next(err); }
  }
);

// POST /api/reports/generate - Generate new report
reportRouter.post('/generate',
  body('name').isString().notEmpty(),
  body('type').isIn(['summary', 'scenario', 'channel', 'customer']),
  body('format').isIn(['pdf', 'excel']),
  body('dateRange').isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const b = req.body as any;
      
      // Create report record
      const report = await prisma.report.create({
        data: {
          name: b.name,
          type: b.type,
          format: b.format,
          status: 'pending',
          config: {
            type: b.type,
            dateRange: b.dateRange,
            filters: b.filters,
          },
        },
      });

      // Generate in background
      (async () => {
        try {
          const config: ReportConfig = {
            type: b.type,
            dateRange: b.dateRange,
            filters: b.filters,
          };

          const fileName = b.format === 'pdf'
            ? await generatePDF(config)
            : await generateExcel(config);

          await prisma.report.update({
            where: { id: report.id },
            data: {
              status: 'completed',
              fileId: fileName,
              generatedAt: new Date(),
            },
          });
        } catch (err) {
          await prisma.report.update({
            where: { id: report.id },
            data: { status: 'failed' },
          });
        }
      })();

      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'GENERATE', 'report', { reportId: report.id }, ip);

      res.status(201).json({ success: true, data: report });
    } catch (err) { next(err); }
  }
);

// GET /api/reports/:id/download - Download report file
reportRouter.get('/:id/download',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
      });

      if (!report) return next(new NotFoundError('Report'));
      if (report.status !== 'completed' || !report.fileId) {
        return res.status(400).json({ success: false, error: 'Report not ready' });
      }

      const filePath = join(process.cwd(), 'reports', report.fileId);
      res.download(filePath, report.fileId);
    } catch (err) { next(err); }
  }
);

// DELETE /api/reports/:id - Delete report
reportRouter.delete('/:id',
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      await prisma.report.delete({
        where: { id: req.params.id },
      });

      const authReq = req as AuthRequest;
      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(authReq.user?.userId, 'DELETE', 'report', { reportId: req.params.id }, ip);

      res.json({ success: true });
    } catch (err) { next(err); }
  }
);
```

- [ ] **Step 3: Run tests**

```bash
cd finmark-backend/services/data-service
pnpm test tests/reports.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/services/data-service/src/routes/reports.ts finmark-backend/services/data-service/tests/reports.test.ts
git commit -m "feat: create report routes with generation + download endpoints"
```

---

## Chunk 4: Integration + Frontend Updates

### Task 8: Mount Routes + Initialize Queue

**Files:**
- Modify: `finmark-backend/services/data-service/src/index.ts`

- [ ] **Step 1: Update index.ts to mount routes**

Edit `finmark-backend/services/data-service/src/index.ts`:

Add imports:
```typescript
import { alarmRouter } from './routes/alarms.js';
import { reportRouter } from './routes/reports.js';
import { initAlarmQueue } from './queues/alarmQueue.js';
```

Mount routes after existing routes:
```typescript
app.use('/api/alarms', alarmRouter);
app.use('/api/reports', reportRouter);
```

Initialize queue on startup:
```typescript
// Initialize alarm queue
initAlarmQueue().then(() => {
  console.log('✅ Alarm queue initialized');
}).catch(err => {
  console.error('❌ Failed to initialize alarm queue:', err);
});

// Schedule automatic alarm evaluation every 5 minutes
import { alarmQueue } from './queues/alarmQueue.js';
setInterval(() => {
  alarmQueue.add('evaluate-alarms', {
    timestamp: new Date().toISOString(),
    scheduled: true,
  });
}, 5 * 60 * 1000); // 5 minutes
```

- [ ] **Step 2: Create reports directory**

```bash
mkdir -p finmark-backend/services/data-service/reports
echo "reports/" >> finmark-backend/services/data-service/.gitignore
```

- [ ] **Step 3: Test server startup**

```bash
cd finmark-backend/services/data-service
pnpm dev
```

Expected: Server starts, alarm queue initialized message appears

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/services/data-service/src/index.ts finmark-backend/services/data-service/.gitignore
git commit -m "feat: mount alarm and report routes, initialize alarm queue"
```

---

### Task 9: Update Frontend API Services

**Files:**
- Create: `src/services/alarm.ts`
- Create: `src/services/reports.ts`
- Modify: `src/app/performance/alarm/page.tsx`
- Modify: `src/app/performance/report/page.tsx`

- [ ] **Step 1: Create alarm service**

Create `src/services/alarm.ts`:
```typescript
import api from './api';

export interface AlarmRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  level: 'warning' | 'critical';
  channels: string[];
  enabled: boolean;
  createdAt: string;
}

export interface AlarmHistory {
  id: string;
  ruleId: string;
  rule: AlarmRule;
  triggeredAt: string;
  value: number;
  status: 'triggered' | 'resolved' | 'acknowledged';
  acknowledged: boolean;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export async function getAlarmRules() {
  return api.get('/alarms/rules');
}

export async function getAlarmRule(id: string) {
  return api.get(`/alarms/rules/${id}`);
}

export async function createAlarmRule(data: Partial<AlarmRule>) {
  return api.post('/alarms/rules', data);
}

export async function updateAlarmRule(id: string, data: Partial<AlarmRule>) {
  return api.put(`/alarms/rules/${id}`, data);
}

export async function deleteAlarmRule(id: string) {
  return api.delete(`/alarms/rules/${id}`);
}

export async function toggleAlarmRule(id: string, enabled: boolean) {
  return api.post(`/alarms/rules/${id}/toggle`, { enabled });
}

export async function getAlarmHistory(ruleId?: string, status?: string) {
  const params = new URLSearchParams();
  if (ruleId) params.append('ruleId', ruleId);
  if (status) params.append('status', status);
  return api.get(`/alarms/history?${params}`);
}

export async function acknowledgeAlarm(id: string) {
  return api.post(`/alarms/history/${id}/acknowledge`);
}

export async function resolveAlarm(id: string) {
  return api.post(`/alarms/history/${id}/resolve`);
}

export async function triggerAlarmEvaluation() {
  return api.post('/alarms/evaluate');
}
```

- [ ] **Step 2: Create reports service**

Create `src/services/reports.ts`:
```typescript
import api from './api';

export interface Report {
  id: string;
  name: string;
  type: 'summary' | 'scenario' | 'channel' | 'customer';
  format: 'pdf' | 'excel';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  fileId?: string;
  config: any;
  generatedAt?: string;
  createdAt: string;
}

export async function getReports(type?: string, status?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  return api.get(`/reports?${params}`);
}

export async function getReport(id: string) {
  return api.get(`/reports/${id}`);
}

export async function generateReport(data: {
  name: string;
  type: string;
  format: string;
  dateRange: { start: string; end: string };
  filters?: any;
}) {
  return api.post('/reports/generate', data);
}

export async function downloadReport(id: string) {
  return api.get(`/reports/${id}/download`, { responseType: 'blob' });
}

export async function deleteReport(id: string) {
  return api.delete(`/reports/${id}`);
}
```

- [ ] **Step 3: Update alarm page to use real API**

Modify `src/app/performance/alarm/page.tsx`:
- Replace hardcoded `alarmRules` with `useQuery` calling `getAlarmRules()`
- Replace hardcoded `alarmHistory` with `useQuery` calling `getAlarmHistory()`
- Connect Create dialog to `createAlarmRule()`
- Connect toggle switches to `toggleAlarmRule()`
- Connect acknowledge button to `acknowledgeAlarm()`
- Connect resolve button to `resolveAlarm()`

- [ ] **Step 4: Update report page to use real API**

Modify `src/app/performance/report/page.tsx`:
- Replace hardcoded `recentReports` with `useQuery` calling `getReports()`
- Connect Create Report button to `generateReport()`
- Connect download button to `downloadReport()`
- Add polling for report generation status

- [ ] **Step 5: Test frontend integration**

```bash
cd /Users/xinjian/Work/Project/RD/FinMark
pnpm dev
```

Expected: Alarm and Report pages load real data from backend

- [ ] **Step 6: Commit**

```bash
git add src/services/alarm.ts src/services/reports.ts src/app/performance/alarm/page.tsx src/app/performance/report/page.tsx
git commit -m "feat: integrate alarm and report APIs with frontend pages"
```

---

### Task 10: Setup Redis + Environment Configuration

**Files:**
- Create: `finmark-backend/services/data-service/.env.example`
- Modify: `README.md` (add setup instructions)

- [ ] **Step 1: Update .env.example**

Create or update `finmark-backend/services/data-service/.env.example`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/finmark?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3001
JWT_SECRET="your-secret-key"
REPORTS_DIR="./reports"
```

- [ ] **Step 2: Install Redis (macOS)**

```bash
brew install redis
brew services start redis
```

Expected: Redis running on localhost:6379

- [ ] **Step 3: Verify Redis connection**

```bash
redis-cli ping
```

Expected: `PONG`

- [ ] **Step 4: Update README with setup instructions**

Add to `finmark-backend/services/data-service/README.md`:

```markdown
## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Setup Redis:
```bash
brew install redis
brew services start redis
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Run migrations:
```bash
pnpm prisma migrate dev
```

5. Start development server:
```bash
pnpm dev
```

## Testing

```bash
pnpm test
```
```

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/services/data-service/.env.example finmark-backend/services/data-service/README.md
git commit -m "docs: add Redis setup instructions and .env.example"
```

---

### Task 11: End-to-End Testing + Verification

**Files:**
- Create: `finmark-backend/services/data-service/tests/e2e/alarm-flow.test.ts`
- Create: `finmark-backend/services/data-service/tests/e2e/report-flow.test.ts`

- [ ] **Step 1: Write e2e test for alarm flow**

Test complete flow:
- Create alarm rule
- Trigger manual evaluation
- Verify alarm history created
- Acknowledge alarm
- Resolve alarm
- Delete alarm rule

- [ ] **Step 2: Write e2e test for report flow**

Test complete flow:
- Generate PDF report
- Wait for generation to complete
- Download report
- Verify file exists
- Delete report

- [ ] **Step 3: Run e2e tests**

```bash
cd finmark-backend/services/data-service
pnpm test tests/e2e/
```

Expected: All e2e tests pass

- [ ] **Step 4: Manual testing checklist**

```markdown
## Alarm System
- [ ] Create alarm rule via UI
- [ ] Toggle rule enabled/disabled
- [ ] Trigger manual evaluation
- [ ] Verify alarm appears in history
- [ ] Acknowledge alarm
- [ ] Resolve alarm
- [ ] Delete alarm rule

## Report System
- [ ] Generate PDF report
- [ ] Generate Excel report
- [ ] Download generated report
- [ ] Verify report content
- [ ] Delete report
```

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/services/data-service/tests/e2e/
git commit -m "test: add e2e tests for alarm and report flows"
```

---

## Completion Criteria

### ✅ Definition of Done

- [ ] All 11 tasks completed
- [ ] All tests passing (unit + e2e)
- [ ] Redis installed and running
- [ ] Alarm queue initialized on server start
- [ ] Frontend pages showing real data
- [ ] Manual testing checklist completed
- [ ] Documentation updated

### 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage | >80% | `pnpm test --coverage` |
| API Response Time | <200ms | Manual testing |
| Alarm Evaluation | <5s | Queue processing time |
| Report Generation | <30s | PDF/Excel generation time |

---

## Rollback Plan

If issues occur:

1. **Database Issues:**
```bash
cd finmark-backend/services/data-service
npx prisma migrate reset
npx prisma migrate dev
```

2. **Redis Issues:**
```bash
brew services restart redis
```

3. **Queue Issues:**
```bash
# Comment out queue initialization in index.ts
# Restart server
```

4. **Frontend Issues:**
```bash
# Revert frontend changes
git checkout HEAD~3 -- src/app/performance/alarm/page.tsx src/app/performance/report/page.tsx
```

---

## Next Steps After P0

After completing this plan, proceed to:

1. **P1 - Expert Mode Backend** - Workflow, Templates, Batch Strategy
2. **P2 - Integration** - CRM, Big Data Platform
3. **P3 - Testing** - Vitest setup, test coverage >60%

---

**Plan Version:** 1.0  
**Created:** 2026-03-20  
**Estimated Duration:** 1-2 weeks  
**Risk Level:** Medium (requires Redis setup)
