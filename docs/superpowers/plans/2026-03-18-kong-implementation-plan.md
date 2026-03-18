# Kong Gateway 配置完善实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** 完善 Kong API Gateway 配置，实现认证、限流、监控、安全功能

**Architecture:** 基于 Kong 声明式配置，通过 YAML 文件管理所有插件和服务路由

**Tech Stack:** Kong, JWT, key-auth, rate-limiting, Prometheus, CORS

---

## 目录结构

```
finmark-backend/
├── kong/
│   ├── kong.yml              # 主配置
│   ├── docker-compose.yml    # Kong + Postgres
│   └── plugins/              # 插件配置
│       ├── auth/             # 认证插件
│       ├── rate-limit/       # 限流插件
│       ├── security/         # 安全插件
│       └── monitoring/       # 监控插件
```

---

## Chunk 1: Kong 基础环境

### 1.1 更新 docker-compose.yml

- [ ] **Step 1: 创建 kong/docker-compose.yml**

```yaml
version: '3.8'

services:
  kong:
    image: kong:3.4
    ports:
      - "8000:8000"   # HTTP
      - "8443:8443"   # HTTPS
      - "8001:8001"   # Admin API
    environment:
      KONG_DATABASE: "postgres"
      KONG_PG_HOST: postgres
      KONG_PG_PORT: 5432
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PG_DATABASE: kong
      KONG_DECLARATIVE_CONFIG: /usr/local/kong/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_LOG_LEVEL: info
    volumes:
      - ./kong.yml:/usr/local/kong/kong.yml:ro
    networks:
      - finmark-network
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: kong
      POSTGRES_PASSWORD: kong
      POSTGRES_DB: kong
    volumes:
      - kong-data:/var/lib/postgresql/data
    networks:
      - finmark-network

  redis:
    image: redis:7-alpine
    networks:
      - finmark-network

volumes:
  kong-data:

networks:
  finmark-network:
    driver: bridge
```

- [ ] **Step 2: 初始化数据库**

```bash
docker-compose up -d kong
docker exec kong kong migrations bootstrap
```

- [ ] **Step 3: Commit**

```bash
git add kong/docker-compose.yml
git commit -m "feat: update Kong docker-compose with Postgres"
```

---

## Chunk 2: 认证配置

### 2.1 创建认证配置

- [ ] **Step 1: 更新 kong.yml 添加认证插件**

```yaml
_format_version: "3.0"
_transform: true

# 消费者定义
consumers:
  - username: frontend
  - username: internal
  - username: rm-app

# JWT 插件配置 (全局)
plugins:
  - name: jwt
    config:
      key_claim_name: kid
      claims_to_verify:
        - exp

  - name: key-auth
    config:
      key_names:
        - x-api-key
        - api-key
      key_in_header: true

# 服务定义
services:
  - name: agent-service
    url: http://agent-service:3001
    routes:
      - name: agent-route
        paths:
          - /api/agents
        strip_path: true
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: redis
          redis_host: redis
      - name: cors

  - name: llm-gateway
    url: http://llm-gateway:3002
    routes:
      - name: llm-route
        paths:
          - /api/llm
        strip_path: true
    plugins:
      - name: key-auth
      - name: rate-limiting
        config:
          minute: 50

  - name: data-service
    url: http://data-service:3003
    routes:
      - name: data-route
        paths:
          - /api/data
        strip_path: true
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 200
```

- [ ] **Step 2: 测试认证**

```bash
# 测试 JWT
curl -X POST http://localhost:8000/api/agents \
  -H "Authorization: Bearer <jwt_token>"

# 测试 API Key
curl -X POST http://localhost:8000/api/llm \
  -H "x-api-key: <api_key>"
```

- [ ] **Step 3: Commit**

```bash
git add kong/kong.yml
git commit -m "feat: add authentication plugins to Kong"
```

---

## Chunk 3: 安全配置

### 3.1 添加安全插件

- [ ] **Step 1: 更新 kong.yml 添加安全插件**

在每个路由的 plugins 中添加:

```yaml
plugins:
  # CORS
  - name: cors
    config:
      origins:
        - "*"
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Authorization
        - Content-Type
        - x-api-key
      exposed_headers:
        - X-Total-Count
      credentials: true
      max_age: 3600

  # 请求大小限制
  - name: request-size-limiting
    config:
      allowed_payload_size: 10
      size_unit: megabytes

  # IP 限制
  - name: ip-restriction
    config:
      allow:
        - 127.0.0.1
        - 10.0.0.0/8
        - 172.16.0.0/12

  # 安全头
  - name: headers-more
    config:
      set:
        - name: X-Frame-Options
          value: DENY
        - name: X-Content-Type-Options
          value: nosniff
        - name: X-XSS-Protection
          value: "1; mode=block"
        - name: Strict-Transport-Security
          value: "max-age=31536000; includeSubDomains"
```

- [ ] **Step 2: Commit**

```bash
git add kong/kong.yml
git commit -m "feat: add security plugins to Kong"
```

---

## Chunk 4: 监控配置

### 4.1 添加监控插件

- [ ] **Step 1: 更新 kong.yml 添加监控**

```yaml
plugins:
  # Prometheus 指标
  - name: prometheus
    config:
      per_consumer: true

  # 请求日志
  - name: http-log
    config:
      log_level: info
      method: POST
```

- [ ] **Step 2: 验证 Prometheus 端点**

```bash
curl http://localhost:8001/prometheus
```

- [ ] **Step 3: Commit**

```bash
git add kong/kong.yml
git commit -m "feat: add monitoring plugins to Kong"
```

---

## 验证步骤

1. `docker-compose up -d`
2. 检查 Kong 状态: `curl http://localhost:8001/status`
3. 测试认证: `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/agents`
4. 测试限流: 发送超过限制的请求
5. 检查监控: `curl http://localhost:8001/prometheus | grep kong_`
