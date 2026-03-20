# P2 System Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Implement complete system integration (CRM, Big Data Platform, Activity Detail) to bring FinMark to 95% production readiness.

**Architecture:** 
- CRM Integration: REST API client with caching and retry logic
- Big Data Platform: GraphQL client for customer analytics
- Activity Detail: Enhanced UI components with drill-down capabilities

**Tech Stack:** 
- Express.js + Prisma (existing)
- Axios with retry (new)
- GraphQL client (new)
- Redis caching (existing)
- React Query for frontend (new)

---

## Chunk 1: CRM Integration

### Task 1: CRM API Client Service

**Files:**
- Create: `finmark-backend/services/data-service/src/services/crmService.ts`
- Create: `finmark-backend/services/data-service/src/config/crm.ts`
- Modify: `finmark-backend/services/data-service/.env.example`

- [ ] **Step 1: Add CRM configuration**

Create `finmark-backend/services/data-service/src/config/crm.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config();

export const crmConfig = {
  baseUrl: process.env.CRM_BASE_URL || 'http://localhost:8080/api',
  apiKey: process.env.CRM_API_KEY || '',
  timeout: Number(process.env.CRM_TIMEOUT) || 5000,
  retryAttempts: Number(process.env.CRM_RETRY_ATTEMPTS) || 3,
  cacheTTL: Number(process.env.CRM_CACHE_TTL) || 300, // 5 minutes
};
```

- [ ] **Step 2: Update .env.example**

Add to `.env.example`:
```bash
# CRM Integration
CRM_BASE_URL=http://core-banking:8080/api
CRM_API_KEY=your-crm-api-key
CRM_TIMEOUT=5000
CRM_RETRY_ATTEMPTS=3
CRM_CACHE_TTL=300
```

- [ ] **Step 3: Write CRM service**

Create `finmark-backend/services/data-service/src/services/crmService.ts`:
```typescript
import axios, { AxiosInstance } from 'axios';
import { crmConfig } from '../config/crm.js';
import { prisma } from '../config/database.js';

class CRMService {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: crmConfig.baseUrl,
      timeout: crmConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': crmConfig.apiKey,
      },
    });

    // Retry interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retryCount) {
          return Promise.reject(error);
        }

        config.retryCount = config.retryCount || 0;
        if (config.retryCount >= crmConfig.retryAttempts) {
          return Promise.reject(error);
        }

        config.retryCount += 1;
        const backoff = Math.pow(2, config.retryCount) * 1000;
        console.log(`Retrying CRM request (${config.retryCount}/${crmConfig.retryAttempts}) after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.client(config);
      }
    );
  }

  async getCustomer(customerId: string) {
    const cacheKey = `customer:${customerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/customers/${customerId}`);
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getCustomerAccounts(customerId: string) {
    const cacheKey = `accounts:${customerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/customers/${customerId}/accounts`);
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getCustomerTransactions(customerId: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await this.client.get(`/customers/${customerId}/transactions?${params}`);
    return response.data;
  }

  async searchCustomers(query: {
    name?: string;
    phone?: string;
    idNumber?: string;
    accountNumber?: string;
  }) {
    const params = new URLSearchParams();
    if (query.name) params.append('name', query.name);
    if (query.phone) params.append('phone', query.phone);
    if (query.idNumber) params.append('idNumber', query.idNumber);
    if (query.accountNumber) params.append('accountNumber', query.accountNumber);

    const response = await this.client.get(`/customers/search?${params}`);
    return response.data;
  }

  async syncCustomers(lastSyncDate?: Date) {
    const params = lastSyncDate ? `?since=${lastSyncDate.toISOString()}` : '';
    const response = await this.client.get(`/customers/sync${params}`);
    
    // Store in local database
    await prisma.crmCustomerSync.createMany({
      data: response.data.customers.map((c: any) => ({
        crmId: c.id,
        name: c.name,
        phone: c.phone,
        idNumber: c.idNumber,
        lastSyncAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return response.data;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > crmConfig.cacheTTL * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const crmService = new CRMService();
```

- [ ] **Step 4: Add Prisma model for CRM sync**

Add to `prisma/schema.prisma`:
```prisma
model CrmCustomerSync {
  id         String   @id @default(uuid())
  crmId      String   @unique
  name       String
  phone      String?
  idNumber   String?
  lastSyncAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@map("crm_customer_sync")
}
```

- [ ] **Step 5: Run migration**
```bash
cd finmark-backend/services/data-service
npx prisma migrate dev --name add_crm_sync
npx prisma generate
```

- [ ] **Step 6: Write tests**

Create `finmark-backend/services/data-service/tests/crmService.test.ts`

- [ ] **Step 7: Commit**
```bash
git add finmark-backend/services/data-service/src/services/crmService.ts \
  finmark-backend/services/data-service/src/config/crm.ts \
  finmark-backend/services/data-service/src/.env.example \
  finmark-backend/services/data-service/prisma/
git commit -m "feat: add CRM integration service with caching and retry"
```

---

### Task 2: CRM Integration Routes

**Files:**
- Create: `finmark-backend/services/data-service/src/routes/crm.ts`

- [ ] **Step 1: Create CRM routes**

Create `finmark-backend/services/data-service/src/routes/crm.ts`:
```typescript
import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';
import { crmService } from '../services/crmService.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const crmRouter: RouterType = Router();

crmRouter.use(requireAuth);

// GET /api/crm/customers/:id - Get customer details
crmRouter.get('/customers/:id',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const customer = await crmService.getCustomer(req.params.id);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/crm/customers/:id/accounts - Get customer accounts
crmRouter.get('/customers/:id/accounts',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const accounts = await crmService.getCustomerAccounts(req.params.id);
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/crm/customers/:id/transactions - Get customer transactions
crmRouter.get('/customers/:id/transactions',
  param('id').isString().notEmpty(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const transactions = await crmService.getCustomerTransactions(req.params.id, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit as number,
      });
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/crm/customers/search - Search customers
crmRouter.get('/customers/search',
  query('name').optional().isString(),
  query('phone').optional().isString(),
  query('idNumber').optional().isString(),
  query('accountNumber').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const customers = await crmService.searchCustomers({
        name: req.query.name as string,
        phone: req.query.phone as string,
        idNumber: req.query.idNumber as string,
        accountNumber: req.query.accountNumber as string,
      });
      res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/crm/customers/sync - Sync customers from CRM
crmRouter.post('/customers/sync',
  query('since').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const lastSyncDate = req.query.since ? new Date(req.query.since as string) : undefined;
      const result = await crmService.syncCustomers(lastSyncDate);
      
      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'SYNC', 'crm', { 
        syncedCount: result.customers?.length || 0 
      }, ip);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);
```

- [ ] **Step 2: Mount routes in index.ts**
- [ ] **Step 3: Write tests**
- [ ] **Step 4: Commit**

---

## Chunk 2: Big Data Platform Integration

### Task 3: Big Data Platform GraphQL Client

**Files:**
- Create: `finmark-backend/services/data-service/src/services/bigDataService.ts`
- Create: `finmark-backend/services/data-service/src/config/bigData.ts`

- [ ] **Step 1: Install dependencies**
```bash
pnpm add graphql graphql-request
```

- [ ] **Step 2: Add configuration**

Create `finmark-backend/services/data-service/src/config/bigData.ts`:
```typescript
export const bigDataConfig = {
  graphqlEndpoint: process.env.BIG_DATA_GRAPHQL_URL || 'http://bigdata:4000/graphql',
  apiKey: process.env.BIG_DATA_API_KEY || '',
  timeout: Number(process.env.BIG_DATA_TIMEOUT) || 10000,
};
```

- [ ] **Step 3: Write Big Data service**

Create `finmark-backend/services/data-service/src/services/bigDataService.ts`:
```typescript
import { GraphQLClient } from 'graphql-request';
import { bigDataConfig } from '../config/bigData.js';

class BigDataService {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(bigDataConfig.graphqlEndpoint, {
      headers: {
        'Authorization': `Bearer ${bigDataConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: bigDataConfig.timeout,
    });
  }

  async getCustomerSegment(customerId: string) {
    const query = `
      query GetCustomerSegment($customerId: ID!) {
        customer(id: $customerId) {
          segment {
            id
            name
            level
            tags
          }
          behaviorScore
          riskScore
        }
      }
    `;

    return this.client.request(query, { customerId });
  }

  async getCustomerBehavior(customerId: string, days: number = 30) {
    const query = `
      query GetCustomerBehavior($customerId: ID!, $days: Int!) {
        customerBehavior(id: $customerId, days: $days) {
          transactionCount
          totalAmount
          avgAmount
          channelUsage {
            channel
            count
          }
          productHoldings {
            product
            amount
          }
        }
      }
    `;

    return this.client.request(query, { customerId, days });
  }

  async searchSegmentCustomers(segmentId: string, filters?: {
    minAsset?: number;
    maxAsset?: number;
    ageRange?: [number, number];
    city?: string;
  }) {
    const query = `
      query SearchSegmentCustomers($segmentId: ID!, $filters: CustomerFilters) {
        segmentCustomers(segmentId: $segmentId, filters: $filters) {
          total
          customers {
            id
            name
            asset
            segment
            tags
          }
        }
      }
    `;

    return this.client.request(query, { segmentId, filters });
  }

  async getAudiencePreview(conditions: any[], limit: number = 1000) {
    const query = `
      query GetAudiencePreview($conditions: [ConditionInput!]!, $limit: Int!) {
        audiencePreview(conditions: $conditions, limit: $limit) {
          total
          sample {
            id
            name
            segment
            asset
            tags
          }
        }
      }
    `;

    return this.client.request(query, { conditions, limit });
  }
}

export const bigDataService = new BigDataService();
```

- [ ] **Step 4: Update .env.example**

Add:
```bash
# Big Data Platform
BIG_DATA_GRAPHQL_URL=http://bigdata:4000/graphql
BIG_DATA_API_KEY=your-bigdata-api-key
BIG_DATA_TIMEOUT=10000
```

- [ ] **Step 5: Write tests**
- [ ] **Step 6: Commit**

---

### Task 4: Audience Builder Enhancement

**Files:**
- Modify: `finmark-backend/services/data-service/src/services/audienceBuilderService.ts` (create if not exists)

- [ ] **Step 1: Create audience builder service**

Create `finmark-backend/services/data-service/src/services/audienceBuilderService.ts`:
```typescript
import { prisma } from '../config/database.js';
import { bigDataService } from './bigDataService.js';

export async function buildAudienceQuery(conditions: any[]) {
  // Build Prisma query from conditions
  const where: any = {};
  
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    
    switch (operator) {
      case 'eq':
        where[field] = value;
        break;
      case 'ne':
        where[field] = { not: value };
        break;
      case 'gt':
        where[field] = { gt: value };
        break;
      case 'gte':
        where[field] = { gte: value };
        break;
      case 'lt':
        where[field] = { lt: value };
        break;
      case 'lte':
        where[field] = { lte: value };
        break;
      case 'in':
        where[field] = { in: value };
        break;
      case 'contains':
        where[field] = { contains: value };
        break;
      case 'startsWith':
        where[field] = { startsWith: value };
        break;
      case 'endsWith':
        where[field] = { endsWith: value };
        break;
    }
  }
  
  return where;
}

export async function executeAudienceQuery(conditions: any[]) {
  const where = await buildAudienceQuery(conditions);
  
  const count = await prisma.customer.count({ where });
  return { total: count };
}

export async function getAudiencePreview(conditions: any[], limit: number = 1000) {
  const where = await buildAudienceQuery(conditions);
  
  const customers = await prisma.customer.findMany({
    where,
    take: limit,
    select: {
      id: true,
      name: true,
      segment: true,
      asset: true,
      tags: true,
    },
  });
  
  const total = await prisma.customer.count({ where });
  
  return { total, sample: customers };
}

export async function saveAudienceSegment(name: string, conditions: any[], description?: string) {
  return prisma.audienceSegment.create({
    data: {
      name,
      description,
      conditions,
      status: 'active',
    },
  });
}
```

- [ ] **Step 2: Add Prisma models**

Add to `prisma/schema.prisma`:
```prisma
model AudienceSegment {
  id          String   @id @default(uuid())
  name        String
  description String?
  conditions  Json
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("audience_segments")
}

model Customer {
  id        String   @id @default(uuid())
  name      String
  segment   String?
  asset     Float?
  tags      String[]
  createdAt DateTime @default(now())

  @@map("customers")
}
```

- [ ] **Step 3: Run migration**
- [ ] **Step 4: Write tests**
- [ ] **Step 5: Commit**

---

## Chunk 3: Activity Detail Implementation

### Task 5: Activity Detail Backend

**Files:**
- Create: `finmark-backend/services/data-service/src/routes/activity.ts`
- Create: `finmark-backend/services/data-service/src/services/activityService.ts`

- [ ] **Step 1: Create activity service**

Create `finmark-backend/services/data-service/src/services/activityService.ts`:
```typescript
import { prisma } from '../config/database.js';

export async function getActivityDetails(activityId: string) {
  const execution = await prisma.execution.findUnique({
    where: { id: activityId },
    include: {
      scenario: true,
    },
  });

  if (!execution) {
    throw new Error('Activity not found');
  }

  const metrics = await getActivityMetrics(activityId);
  const timeline = await getActivityTimeline(activityId);
  const customerBreakdown = await getCustomerBreakdown(activityId);

  return {
    execution,
    metrics,
    timeline,
    customerBreakdown,
  };
}

async function getActivityMetrics(activityId: string) {
  const execution = await prisma.execution.findUnique({
    where: { id: activityId },
  });

  const reach = execution?.actualReach || 0;
  const response = execution?.actualResponse || 0;
  const conversion = execution?.actualConversion || 0;

  return {
    reach,
    reachRate: reach,
    responseRate: reach > 0 ? (response / reach * 100).toFixed(2) : 0,
    conversionRate: reach > 0 ? (conversion / reach * 100).toFixed(2) : 0,
    roi: (execution?.result as any)?.roi || 0,
  };
}

async function getActivityTimeline(activityId: string) {
  return [
    { event: 'Created', timestamp: execution?.createdAt },
    { event: 'Started', timestamp: execution?.startedAt },
    { event: 'Completed', timestamp: execution?.completedAt },
  ].filter(e => e.timestamp);
}

async function getCustomerBreakdown(activityId: string) {
  // Implement customer breakdown logic
  return {
    bySegment: [],
    byChannel: [],
    byRegion: [],
  };
}
```

- [ ] **Step 2: Create activity routes**
- [ ] **Step 3: Mount routes**
- [ ] **Step 4: Write tests**
- [ ] **Step 5: Commit**

---

### Task 6: Activity Detail Frontend

**Files:**
- Create: `src/app/performance/activity/[id]/page.tsx`
- Create: `src/components/performance/ActivityDetail.tsx`
- Modify: `src/app/performance/page.tsx`

- [ ] **Step 1: Create activity detail page**
- [ ] **Step 2: Connect to backend API**
- [ ] **Step 3: Update performance page links**
- [ ] **Step 4: Test integration**
- [ ] **Step 5: Commit**

---

## Chunk 4: Final Integration

### Task 7: Mount All Routes + Environment Setup

**Files:**
- Modify: `finmark-backend/services/data-service/src/index.ts`
- Modify: `finmark-backend/services/data-service/.env.example`

- [ ] **Step 1: Mount CRM routes**
- [ ] **Step 2: Mount Big Data routes**
- [ ] **Step 3: Mount Activity routes**
- [ ] **Step 4: Update documentation**
- [ ] **Step 5: Test server startup**
- [ ] **Step 6: Commit**

---

### Task 8: Frontend API Services

**Files:**
- Create: `src/services/crm.ts`
- Create: `src/services/bigData.ts`
- Create: `src/services/activity.ts`

- [ ] **Step 1: Create CRM service**
- [ ] **Step 2: Create Big Data service**
- [ ] **Step 3: Create Activity service**
- [ ] **Step 4: Test integration**
- [ ] **Step 5: Commit**

---

## Completion Criteria

### ✅ Definition of Done

- [ ] All 8 tasks completed
- [ ] All tests passing
- [ ] CRM integration working with retry and caching
- [ ] Big Data GraphQL integration functional
- [ ] Audience builder connected to real data
- [ ] Activity detail page complete
- [ ] Frontend fully integrated
- [ ] Documentation updated

### 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage | >70% | `pnpm test --coverage` |
| API Response Time | <500ms | Manual testing |
| CRM Cache Hit Rate | >80% | Monitoring |
| Frontend Load Time | <2s | Lighthouse |

---

## Estimated Duration: 1-2 weeks
## Risk Level: Medium-High (external dependencies)
