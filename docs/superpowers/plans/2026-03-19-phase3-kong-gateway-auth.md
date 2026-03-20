# Phase 3: Kong Gateway + 认证

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 Kong API Gateway，实现 JWT 认证、限流、CORS、安全策略；修复前端硬编码凭据问题

**Architecture:**
- Kong Gateway (声明式 YAML 配置)
- JWT 认证插件
- 限流插件 (Redis)
- CORS + 安全头
- 前端登录替换为真实后端 API

**Tech Stack:** Kong 3.4, Docker Compose, PostgreSQL (Kong DB), Redis

**依赖:** Phase 1 (Data Service) + Phase 2 (Agent Service)

---

## Chunk 1: Kong Gateway 基础设置

### 1.1 更新 Docker Compose

- [ ] **Step 1: 创建 kong 目录**

```bash
mkdir -p finmark-backend/kong
```

- [ ] **Step 2: 更新 finmark-backend/docker-compose.yml**

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

  # Kong with PostgreSQL backend
  kong:
    image: kong:3.4
    ports:
      - "8000:8000"   # Proxy HTTP
      - "8443:8443"   # Proxy HTTPS
      - "8001:8001"   # Admin HTTP
      - "8444:8444"   # Admin HTTPS
    environment:
      KONG_DATABASE: "postgres"
      KONG_PG_HOST: postgres
      KONG_PG_PORT: 5432
      KONG_PG_USER: finmark
      KONG_PG_PASSWORD: finmark123
      KONG_PG_DATABASE: finmark
      KONG_DECLARATIVE_CONFIG: /usr/local/kong/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_LOG_LEVEL: info
      KONG_PLUGINS: bundled,rate-limiting,prometheus
    volumes:
      - ./kong/kong.yml:/usr/local/kong/kong.yml:ro
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - finmark-network

volumes:
  postgres-data:

networks:
  finmark-network:
    driver: bridge
```

### 1.2 创建 Kong 声明式配置

- [ ] **Step 3: 创建 finmark-backend/kong/kong.yml**

```yaml
_format_version: "3.0"
_transform: true

# ==================== 服务定义 ====================

services:
  # Auth Service (Login/Register - 无需认证)
  - name: auth-service
    url: http://host.docker.internal:3001  # Data Service
    routes:
      - name: auth-route
        paths:
          - /api/auth
        strip_path: false
    plugins:
      - name: cors

  # Data Service (需要认证)
  - name: data-service
    url: http://host.docker.internal:3001
    routes:
      - name: data-route
        paths:
          - /api/scenarios
          - /api/atoms
          - /api/users
        strip_path: false
    plugins:
      - name: cors
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
          policy: redis
          redis_host: redis
          redis_port: 6379
          fault_tolerant: true

  # Agent Service (需要认证，限流较宽松)
  - name: agent-service
    url: http://host.docker.internal:3003
    routes:
      - name: agent-route
        paths:
          - /api/agents
        strip_path: false
    plugins:
      - name: cors
      - name: rate-limiting
        config:
          minute: 30
          hour: 200
          policy: redis
          redis_host: redis
          redis_port: 6379
          fault_tolerant: true

  # LLM Gateway (内部服务，不对外暴露)

# ==================== JWT 认证插件 ====================
# 注意: auth-service 不需要 JWT 认证 (登录注册路由)

# JWT 验证通过 Kong 的消费者 + JWT 插件实现
# 消费者在 Data Service 中创建 (admin 用户)
# JWT 签名验证在 Kong 层完成

# ==================== 安全插件 ====================
plugins:
  # CORS 配置
  - name: cors
    config:
      origins:
        - "*"
      methods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      headers:
        - Authorization
        - Content-Type
        - Accept
        - X-Requested-With
      exposed_headers:
        - X-Total-Count
        - X-Request-Id
      credentials: true
      max_age: 3600
      preflight_continue: false

  # 请求大小限制
  - name: request-size-limiting
    config:
      allowed_payload_size: 10
      size_unit: megabytes

  # Prometheus 监控
  - name: prometheus
    config:
      per_consumer: true

# ==================== 消费者 (用于限流) ====================
consumers:
  - username: default-consumer
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
          policy: redis
          redis_host: redis
          redis_port: 6379
```

> **注意**: 由于 Kong DB-less 模式下 JWT 验证较复杂，我们将采用简化方案：
> - Kong 只做路由、限流、CORS、安全头
> - JWT 验证由 Data Service 负责（Phase 1 已实现）
> - 前端在登录后存储 JWT token，后续请求携带 Authorization header
> - 后续如需 Kong 层 JWT 验证，添加 jwt-secret-validator 插件

### 1.3 添加 health check 路由

- [ ] **Step 4: 更新 kong.yml 添加 health check**

```yaml
  # Health check 路由 (无认证)
  - name: health-service
    url: http://host.docker.internal:3001
    routes:
      - name: health-route
        paths:
          - /health
        strip_path: false
```

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/
git commit -m "feat(phase3): add Kong Gateway with routing and plugins"
```

---

## Chunk 2: 前端认证安全修复 (P0)

### 2.1 移除硬编码凭据

这是 Phase 1 的安全审查中发现的严重问题 — 必须修复。

- [ ] **Step 1: 修改 src/app/login/page.tsx - 移除硬编码密码**

```typescript
// ❌ 删除这行 (第 12-15 行):
const MOCK_USERS = [
  { username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
  { username: 'manager1', password: 'manager123', name: '李四', role: 'manager' },
  { username: 'operator1', password: 'operator123', name: '王五', role: 'operator' },
];

// ✅ 替换为真实 API 调用:
import api from '@/services/api';

export default function LoginPage() {
  // ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      
      login(response.data.token, response.data.user);
      navigate('/copilot');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };
}
```

- [ ] **Step 2: 移除测试账号填充功能**

```typescript
// 删除以下代码 (第 70-74 行 fillTestAccount 函数)
// 以及第 187-206 行的测试账号展示区域

// ✅ 替换为环境提示 (开发环境显示 API 地址)
{import.meta.env.DEV && (
  <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
    API: {import.meta.env.VITE_API_BASE_URL || '/api'}
  </div>
)}
```

- [ ] **Step 3: 修复 src/services/api.ts - 添加更好的错误处理**

```typescript
// 更新 api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 网络错误
    if (!error.response) {
      const message = '网络连接失败，请检查网络';
      console.error('[API]', message);
      return Promise.reject(new Error(message));
    }

    // HTTP 错误
    const status = error.response.status;
    const apiError = error.response.data?.error?.message || error.response.data?.message;
    
    // 401 未授权 -> 清除 token 并跳转登录
    if (status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }

    // 其他错误
    const message = apiError || `请求失败 (${status})`;
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
```

- [ ] **Step 4: 更新 .env.example**

```bash
# FinMark Frontend
VITE_API_BASE_URL=http://localhost:8000  # 指向 Kong Gateway (开发环境直连 Data Service)

# Gemini API (前端开发模式使用 Mock, 真实调用走后端)
VITE_USE_MOCK=true  # 开发时设为 false 启用真实 Gemini
```

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx src/services/api.ts .env.example
git commit -m "fix(phase3): remove hardcoded credentials, use real auth API"
```

---

## Chunk 3: 启动和验证

### 3.1 端到端测试

- [ ] **Step 1: 启动所有服务**

```bash
cd finmark-backend

# 启动基础设施
docker-compose up -d postgres redis

# 启动后端服务 (三个终端)
pnpm dev:data   # Data Service (port 3001)
pnpm dev:llm   # LLM Gateway (port 3002) - 需要 GEMINI_API_KEY
pnpm dev:agent # Agent Service (port 3003)

# 启动 Kong (Docker)
docker-compose up -d kong

# 验证 Kong
curl http://localhost:8001/status
curl http://localhost:8000/health
```

- [ ] **Step 2: 通过 Kong 测试 API**

```bash
# 测试认证 (直连 Data Service)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@finmark.com","password":"admin123","name":"管理员","role":"admin"}'

# 通过 Kong 登录
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 期望: 返回 JWT token

# 使用 token 测试需要认证的 API
TOKEN="your-jwt-token"
curl http://localhost:8000/api/scenarios \
  -H "Authorization: Bearer $TOKEN"
# 期望: 返回场景列表

# 测试 Agent Service (通过 Kong)
curl -X POST http://localhost:8000/api/agents/insight \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"goal":"推广新发基金","lang":"zh"}'
```

- [ ] **Step 3: 测试限流**

```bash
# 超过限流阈值后应返回 429
for i in {1..35}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/health
done
# 期望: 大部分返回 200，最后几个返回 429
```

- [ ] **Step 4: 启动前端验证**

```bash
# 前端 .env.local
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
npm run dev
# 访问 http://localhost:3000
# 测试登录流程
```

- [ ] **Step 5: Commit**

```bash
git add finmark-backend/docker-compose.yml finmark-backend/kong/
git commit -m "feat(phase3): complete Kong Gateway with auth integration"
```

---

## 验证清单

- [ ] Docker Compose 所有容器正常启动
- [ ] Kong Proxy (8000) 和 Admin (8001) 端口可用
- [ ] GET `/health` → Data Service 健康
- [ ] POST `/api/auth/login` → 返回 JWT
- [ ] POST `/api/auth/register` → 创建用户
- [ ] GET `/api/scenarios` (无 token) → 401 Unauthorized
- [ ] GET `/api/scenarios` (有 token) → 返回数据
- [ ] POST `/api/agents/insight` (有 token) → 返回分析结果
- [ ] 限流触发 → 429 Too Many Requests
- [ ] CORS headers 正确返回
- [ ] 前端登录使用真实 API (无硬编码凭据)
- [ ] 401 响应触发前端跳转登录页

---

## Docker Compose production-ready 配置

最终 `finmark-backend/docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  kong:
    image: kong:3.4
    ports:
      - "80:8000"
      - "443:8443"
    environment:
      KONG_DATABASE: "postgres"
      KONG_PG_HOST: postgres
      KONG_PG_PORT: 5432
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: ${KONG_DB_PASSWORD}
      KONG_PG_DATABASE: kong
      KONG_DECLARATIVE_CONFIG: /usr/local/kong/kong.yml
      KONG_SSL_CERT: /etc/kong/ssl/cert.pem
      KONG_SSL_CERT_KEY: /etc/kong/ssl/key.pem
    volumes:
      - ./kong/kong.yml:/usr/local/kong/kong.yml:ro
      - ./kong/ssl:/etc/kong/ssl:ro
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  data-service:
    build:
      context: ./services/data-service
    environment:
      DATABASE_URL: postgresql://finmark:${DB_PASSWORD}@postgres:5432/finmark
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production

  agent-service:
    build:
      context: ./services/agent-service
    environment:
      LLM_GATEWAY_URL: http://llm-gateway:3002
      NODE_ENV: production

  llm-gateway:
    build:
      context: ./services/llm-gateway
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      NODE_ENV: production

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: finmark
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: finmark
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres-data:
```

---

## 已知限制

1. **JWT 验证在 Kong 层未实现**: 当前 JWT 验证在 Data Service 层实现。Kong 层只做路由和限流。如需 Kong 层验证，需添加 `jwt-plugin` 并配置消费者。
2. **无 API Key 管理**: 暂未实现 Kong Consumer + API Key 认证。后续按需添加。
3. **无 HTTPS**: 生产部署需要配置 SSL 证书。
