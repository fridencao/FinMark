# Phase 1: 后端基础设施 + Data Service

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建后端 monorepo，搭建 PostgreSQL 数据库，实现场景、策略原子、用户管理的 CRUD API

**Architecture:**
- 使用 pnpm workspaces 构建 monorepo
- PostgreSQL (Prisma ORM)
- Redis (缓存 + 限流)
- JWT 认证

**Tech Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, pnpm

---

## 目录结构

```
finmark-backend/
├── docker-compose.yml          # PostgreSQL + Redis
├── pnpm-workspace.yaml
├── package.json                # Root workspace
├── services/
│   └── data-service/            # 数据服务
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── config/
│       │   │   └── database.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   └── error.ts
│       │   ├── routes/
│       │   │   ├── index.ts
│       │   │   ├── auth.ts
│       │   │   ├── scenarios.ts
│       │   │   ├── atoms.ts
│       │   │   └── users.ts
│       │   └── types/
│       │       └── index.ts
│       └── prisma/
│           └── schema.prisma
└── .env.example
```

---

## Chunk 1: 项目初始化

### 1.1 创建后端目录和 Docker Compose

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p finmark-backend/services/data-service/src/{config,middleware,routes,types}
mkdir -p finmark-backend/services/data-service/prisma
```

- [ ] **Step 2: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: finmark
      POSTGRES_PASSWORD: finmark123
      POSTGRES_DB: finmark
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finmark"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

- [ ] **Step 3: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - 'services/*'
```

- [ ] **Step 4: 创建根 package.json**

```json
{
  "name": "finmark-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "start": "pnpm -r start",
    "db:push": "pnpm --filter data-service db:push",
    "db:generate": "pnpm --filter data-service db:generate",
    "db:studio": "pnpm --filter data-service db:studio"
  }
}
```

- [ ] **Step 5: 创建 .env.example**

```bash
# Database
DATABASE_URL="postgresql://finmark:finmark123@localhost:5432/finmark"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# Service
PORT=3001
NODE_ENV=development
```

- [ ] **Step 6: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase1): add backend monorepo structure and Docker Compose"
```

---

## Chunk 2: Data Service 基础配置

### 2.1 创建 Data Service 配置文件

- [ ] **Step 1: 创建 services/data-service/package.json**

```json
{
  "name": "data-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "express-validator": "^7.2.0",
    "jsonwebtoken": "^9.0.2",
    "redis": "^4.7.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.0.0",
    "prisma": "^6.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 创建 services/data-service/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 创建 services/data-service/.env**

```bash
cp ../../.env.example .env
# 修改 DATABASE_URL 为实际值
```

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase1): add data-service package configuration"
```

---

## Chunk 3: Prisma Schema (数据库模型)

### 3.1 创建 Prisma Schema

- [ ] **Step 1: 创建 services/data-service/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 用户与认证 ====================

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  email        String    @unique
  password     String
  name         String
  role         UserRole  @default(operator)
  status       UserStatus @default(enabled)
  lastLogin    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  auditLogs    AuditLog[]

  @@map("users")
}

enum UserRole {
  admin
  manager
  operator
  readonly
}

enum UserStatus {
  enabled
  disabled
}

// ==================== 场景 ====================

model Scenario {
  id              String         @id @default(uuid())
  title           String
  goal            String
  category        ScenarioCategory
  icon            String?
  color           String?
  config          Json?          // insightConfig, segmentConfig, contentConfig, strategyConfig
  status          ScenarioStatus @default(draft)
  complianceScore Int?
  riskLevel       String?
  isCustom        Boolean        @default(false)
  executions      Execution[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@map("scenarios")
}

enum ScenarioCategory {
  acquisition  // 获客期
  growth       // 成长期
  mature       // 成熟期
  declining    // 衰退期
  recovery     // 挽回期
}

enum ScenarioStatus {
  draft
  active
  paused
  archived
}

// ==================== 执行记录 ====================

model Execution {
  id            String           @id @default(uuid())
  scenarioId    String
  scenario      Scenario         @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  status        ExecutionStatus  @default(pending)
  config        Json?
  result        Json?
  targetCount   Int?
  actualReach   Int?
  actualResponse Int?
  actualConversion Int?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime         @default(now())

  @@map("executions")
}

enum ExecutionStatus {
  pending
  running
  completed
  failed
  paused
}

// ==================== 策略原子 ====================

model Atom {
  id           String   @id @default(uuid())
  name         String
  type         AtomType
  description  String?
  successRate Float?
  usageCount   Int      @default(0)
  tags         String[] // PostgreSQL array
  config       Json?
  scenarios    String[] // 适用场景
  status       AtomStatus @default(active)
  version      String   @default("v1.0")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("atoms")
}

enum AtomType {
  hook      // 钩子
  channel   // 渠道
  content   // 内容
  risk      // 风险
}

enum AtomStatus {
  active
  inactive
}

// ==================== 模型配置 ====================

model ModelConfig {
  id           String   @id @default(uuid())
  name         String
  provider     String   // google, openai, anthropic, qwen, ernie
  apiUrl       String?
  apiKey       String
  modelVersion String
  temperature  Float    @default(0.7)
  maxTokens    Int      @default(4096)
  status       ConfigStatus @default(enabled)
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("model_configs")
}

enum ConfigStatus {
  enabled
  disabled
}

// ==================== 审计日志 ====================

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String
  resource  String
  details   Json?
  ip        String?
  createdAt DateTime @default(now())

  @@map("audit_logs")
}
```

- [ ] **Step 2: 安装依赖并生成 Prisma Client**

```bash
cd finmark-backend
pnpm install
pnpm db:push
pnpm db:generate
```

- [ ] **Step 3: 验证数据库连接**

```bash
pnpm db:studio
# 应在浏览器打开 Prisma Studio，显示所有表
```

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase1): add Prisma schema with all models"
```

---

## Chunk 4: 数据库配置和错误处理

### 4.1 创建数据库配置

- [ ] **Step 1: 创建 services/data-service/src/config/database.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 数据库连接健康检查
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
```

### 4.2 创建错误处理中间件

- [ ] **Step 2: 创建 services/data-service/src/middleware/error.ts**

```typescript
import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

// 全局错误处理中间件
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Prisma 错误处理
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: 'Resource already exists' },
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }
  }

  // 未知错误
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
}

// 404 处理
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase1): add database config and error handling middleware"
```

---

## Chunk 5: 认证中间件 (JWT)

### 5.1 创建 JWT 认证

- [ ] **Step 1: 创建 services/data-service/src/middleware/auth.ts**

```typescript
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { UnauthorizedError, ForbiddenError } from './error.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// 生成 JWT
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// 验证 JWT (需要登录)
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // 验证用户存在且状态正常
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { status: true },
    });
    
    if (!user || user.status === 'disabled') {
      return next(new UnauthorizedError('User not found or disabled'));
    }
    
    req.user = payload;
    next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

// 验证角色 (需要特定角色)
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

// 可选认证 (不强制登录，但不设置 req.user)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = payload;
  } catch {
    // Token 无效，但不影响请求
  }
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase1): add JWT authentication middleware"
```

---

## Chunk 6: API 路由实现

### 6.1 认证路由

- [ ] **Step 1: 创建 services/data-service/src/routes/auth.ts**

```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { ValidationError, UnauthorizedError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.status === 'disabled') {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // 审计日志
    await createAuditLog(user.id, 'LOGIN', 'user', { username }, req.ip);

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register (仅管理员可创建用户)
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, name, role = 'operator' } = req.body;

    if (!username || !email || !password || !name) {
      throw new ValidationError('All fields are required');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const authReq = req as any;
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
```

### 6.2 场景路由

- [ ] **Step 2: 创建 services/data-service/src/routes/scenarios.ts**

```typescript
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';

const router = Router();

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((e: any) => e.msg).join(', '));
  }
  next();
};

// GET /api/scenarios - 获取场景列表
router.get('/',
  requireAuth,
  query('category').optional().isString(),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { category, status, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category) where.category = category;
      if (status) where.status = status;

      const [scenarios, total] = await Promise.all([
        prisma.scenario.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            goal: true,
            category: true,
            icon: true,
            color: true,
            status: true,
            complianceScore: true,
            riskLevel: true,
            isCustom: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { executions: true } },
          },
        }),
        prisma.scenario.count({ where }),
      ]);

      res.json({
        success: true,
        data: scenarios,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/scenarios/defaults - 获取默认场景
router.get('/defaults', async (req, res, next) => {
  try {
    const defaults = await prisma.scenario.findMany({
      where: { isCustom: false },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: defaults });
  } catch (err) {
    next(err);
  }
});

// GET /api/scenarios/categories - 获取分类
router.get('/categories', async (req, res, next) => {
  try {
    const categories = [
      { value: 'acquisition', label: '获客期' },
      { value: 'growth', label: '成长期' },
      { value: 'mature', label: '成熟期' },
      { value: 'declining', label: '衰退期' },
      { value: 'recovery', label: '挽回期' },
    ];
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/scenarios/:id - 获取场景详情
router.get('/:id',
  requireAuth,
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const scenario = await prisma.scenario.findUnique({
        where: { id: req.params.id },
        include: {
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!scenario) {
        throw new NotFoundError('Scenario');
      }

      res.json({ success: true, data: scenario });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/scenarios - 创建场景
router.post('/',
  requireAuth,
  body('title').isString().notEmpty(),
  body('goal').isString().notEmpty(),
  body('category').isIn(['acquisition', 'growth', 'mature', 'declining', 'recovery']),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { title, goal, category, icon, color, config } = req.body;

      const scenario = await prisma.scenario.create({
        data: {
          title,
          goal,
          category,
          icon,
          color,
          config,
          isCustom: true,
        },
      });

      await createAuditLog(req.user.userId, 'CREATE', 'scenario', { scenarioId: scenario.id }, req.ip);

      res.status(201).json({ success: true, data: scenario });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/scenarios/:id - 更新场景
router.put('/:id',
  requireAuth,
  param('id').isUUID(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { title, goal, category, config, status, icon, color } = req.body;

      const scenario = await prisma.scenario.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(goal && { goal }),
          ...(category && { category }),
          ...(config && { config }),
          ...(status && { status }),
          ...(icon !== undefined && { icon }),
          ...(color !== undefined && { color }),
        },
      });

      await createAuditLog(req.user.userId, 'UPDATE', 'scenario', { scenarioId: scenario.id }, req.ip);

      res.json({ success: true, data: scenario });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/scenarios/:id - 删除场景
router.delete('/:id',
  requireAuth,
  param('id').isUUID(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      await prisma.scenario.delete({
        where: { id: req.params.id },
      });

      await createAuditLog(req.user.userId, 'DELETE', 'scenario', { scenarioId: req.params.id }, req.ip);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/scenarios/generate - AI 生成场景
router.post('/generate',
  requireAuth,
  body('description').isString().notEmpty(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      // TODO: 调用 AI 服务生成场景配置
      // 暂时返回示例
      const { description } = req.body;
      res.json({
        success: true,
        data: {
          title: `AI Generated: ${description.slice(0, 20)}...`,
          goal: description,
          category: 'growth',
          config: {},
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/scenarios/:id/execute - 执行场景
router.post('/:id/execute',
  requireAuth,
  param('id').isUUID(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const scenario = await prisma.scenario.findUnique({
        where: { id: req.params.id },
      });

      if (!scenario) {
        throw new NotFoundError('Scenario');
      }

      const execution = await prisma.execution.create({
        data: {
          scenarioId: scenario.id,
          status: 'pending',
          config: req.body,
        },
      });

      // TODO: 触发异步执行任务 (发送到消息队列)

      await createAuditLog(req.user.userId, 'EXECUTE', 'scenario', { scenarioId: scenario.id, executionId: execution.id }, req.ip);

      res.status(201).json({ success: true, data: execution });
    } catch (err) {
      next(err);
    }
  }
);

export { router as scenarioRouter };
```

### 6.3 策略原子路由

- [ ] **Step 3: 创建 services/data-service/src/routes/atoms.ts**

```typescript
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';

const router = Router();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((e: any) => e.msg).join(', '));
  }
  next();
};

// GET /api/atoms - 获取策略原子列表
router.get('/',
  requireAuth,
  query('type').optional().isIn(['hook', 'channel', 'content', 'risk']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { type, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (type) where.type = type;

      const [atoms, total] = await Promise.all([
        prisma.atom.findMany({
          where,
          skip,
          take: limit,
          orderBy: { usageCount: 'desc' },
        }),
        prisma.atom.count({ where }),
      ]);

      res.json({
        success: true,
        data: atoms,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/atoms/:id
router.get('/:id',
  requireAuth,
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const atom = await prisma.atom.findUnique({ where: { id: req.params.id } });
      if (!atom) throw new NotFoundError('Atom');
      res.json({ success: true, data: atom });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/atoms - 创建策略原子
router.post('/',
  requireAuth,
  body('name').isString().notEmpty(),
  body('type').isIn(['hook', 'channel', 'content', 'risk']),
  body('description').optional().isString(),
  body('successRate').optional().isFloat({ min: 0, max: 100 }),
  body('tags').optional().isArray(),
  body('config').optional().isObject(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { name, type, description, successRate, tags, config, scenarios } = req.body;

      const atom = await prisma.atom.create({
        data: {
          name,
          type,
          description,
          successRate,
          tags: tags || [],
          config,
          scenarios: scenarios || [],
        },
      });

      await createAuditLog(req.user.userId, 'CREATE', 'atom', { atomId: atom.id }, req.ip);

      res.status(201).json({ success: true, data: atom });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/atoms/:id
router.put('/:id',
  requireAuth,
  param('id').isUUID(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const atom = await prisma.atom.update({
        where: { id: req.params.id },
        data: req.body,
      });

      await createAuditLog(req.user.userId, 'UPDATE', 'atom', { atomId: atom.id }, req.ip);

      res.json({ success: true, data: atom });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/atoms/:id
router.delete('/:id',
  requireAuth,
  param('id').isUUID(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      await prisma.atom.delete({ where: { id: req.params.id } });
      await createAuditLog(req.user.userId, 'DELETE', 'atom', { atomId: req.params.id }, req.ip);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export { router as atomRouter };
```

### 6.4 用户管理路由

- [ ] **Step 4: 创建 services/data-service/src/routes/users.ts**

```typescript
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

const router = Router();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array().map((e: any) => e.msg).join(', '));
  }
  next();
};

// GET /api/users - 用户列表
router.get('/',
  requireAuth,
  requireRole('admin'),
  async (req: any, res: any, next: any) => {
    try {
      const { page = 1, limit = 20, role } = req.query;
      const skip = ((page as number) - 1) * (limit as number);

      const where: any = {};
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit as number,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
            status: true,
            lastLogin: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: { page, limit, total, pages: Math.ceil(total / (limit as number)) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/users - 创建用户
router.post('/',
  requireAuth,
  requireRole('admin'),
  body('username').isString().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isString().notEmpty(),
  body('role').optional().isIn(['admin', 'manager', 'operator', 'readonly']),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { username, email, password, name, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { username, email, password: hashedPassword, name, role: role || 'operator' },
        select: {
          id: true, username: true, email: true, name: true, role: true, status: true, createdAt: true,
        },
      });

      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/:id
router.put('/:id',
  requireAuth,
  requireRole('admin'),
  param('id').isUUID(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { name, email, role, status } = req.body;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(role && { role }),
          ...(status && { status }),
        },
        select: {
          id: true, username: true, email: true, name: true, role: true, status: true,
        },
      });

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/users/:id
router.delete('/:id',
  requireAuth,
  requireRole('admin'),
  param('id').isUUID(),
  validate,
  async (req: any, res: any, next: any) => {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/roles - 获取角色列表
router.get('/roles', requireAuth, async (req, res) => {
  res.json({
    success: true,
    data: [
      { value: 'admin', label: '管理员' },
      { value: 'manager', label: '业务经理' },
      { value: 'operator', label: '运营人员' },
      { value: 'readonly', label: '只读用户' },
    ],
  });
});

export { router as userRouter };
```

### 6.5 路由入口

- [ ] **Step 5: 创建 services/data-service/src/routes/index.ts**

```typescript
export { authRouter } from './auth.js';
export { scenarioRouter } from './scenarios.js';
export { atomRouter } from './atoms.js';
export { userRouter } from './users.js';
```

### 6.6 类型工具

- [ ] **Step 6: 创建 services/data-service/src/types/index.ts**

```typescript
import { prisma } from '../config/database.js';

export async function createAuditLog(
  userId: string | undefined,
  action: string,
  resource: string,
  details: any,
  ip: string | undefined
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ip,
      },
    });
  } catch (err) {
    // 审计日志失败不应影响主流程
    console.error('Audit log failed:', err);
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase1): add all API routes (auth, scenarios, atoms, users)"
```

---

## Chunk 7: 服务入口文件

### 7.1 创建入口文件

- [ ] **Step 1: 创建 services/data-service/src/index.ts**

```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter, scenarioRouter, atomRouter, userRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { checkDatabaseHealth } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (开发环境)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  if (dbHealthy) {
    res.json({ status: 'ok', service: 'data-service', database: 'connected' });
  } else {
    res.status(503).json({ status: 'error', service: 'data-service', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/scenarios', scenarioRouter);
app.use('/api/atoms', atomRouter);
app.use('/api/users', userRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Data Service running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
```

- [ ] **Step 2: 启动并验证 Data Service**

```bash
cd finmark-backend
docker-compose up -d postgres redis
pnpm install
pnpm dev
```

- [ ] **Step 3: 测试 API**

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试创建管理员用户 (第一个用户)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@finmark.com","password":"admin123","name":"管理员","role":"admin"}'

# 测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用 token 测试场景列表
curl http://localhost:3001/api/scenarios \
  -H "Authorization: Bearer <token>"
```

- [ ] **Step 4: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase1): add data-service entry point and startup"
```

---

## 验证清单

- [ ] `docker-compose up -d` 启动 PostgreSQL + Redis 成功
- [ ] `pnpm db:push` 数据库迁移成功
- [ ] `pnpm dev` Data Service 启动成功
- [ ] GET `/health` 返回 `{"status":"ok"}`
- [ ] POST `/api/auth/register` 创建管理员成功
- [ ] POST `/api/auth/login` 返回 JWT token
- [ ] GET `/api/scenarios` 返回空数组 + pagination
- [ ] GET `/api/atoms` 返回空数组 + pagination
- [ ] GET `/api/users` 需要认证
- [ ] 无 console.error 输出
- [ ] 所有 API 返回统一格式 `{"success": true/false, "data/error": ...}`

---

## 清理 / 种子数据 (可选)

如需创建初始数据，创建 `prisma/seed.ts`:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建管理员
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@finmark.com',
      password: await bcrypt.hash('admin123', 12),
      name: '管理员',
      role: 'admin',
    },
  });

  // 创建默认场景
  const scenarios = [
    { title: '流失挽回', goal: '识别近30天资产下降超过30%的客户并进行挽回营销', category: 'recovery', icon: 'Users', color: 'bg-rose-50', complianceScore: 98, riskLevel: 'low', isCustom: false },
    { title: '新发基金推广', goal: '针对有理财经验且风险偏好为中高风险的客户推广新发ESG基金', category: 'growth', icon: 'Zap', color: 'bg-indigo-50', complianceScore: 95, riskLevel: 'medium', isCustom: false },
    { title: '信用卡分期提升', goal: '筛选有大额消费记录但未办理分期的客户，推送分期优惠券', category: 'growth', icon: 'TrendingUp', color: 'bg-emerald-50', complianceScore: 99, riskLevel: 'low', isCustom: false },
    { title: '个人养老金开户', goal: '针对符合开户条件且未开立养老金账户的代发工资客户进行推广', category: 'acquisition', icon: 'ShieldCheck', color: 'bg-orange-50', complianceScore: 97, riskLevel: 'low', isCustom: false },
  ];

  for (const s of scenarios) {
    await prisma.scenario.upsert({
      where: { id: s.title },
      update: {},
      create: { id: s.title, ...s },
    });
  }

  console.log('Seed data created');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
```

运行种子数据:

```bash
npx tsx prisma/seed.ts
```
