# Kong Gateway 配置完善设计

## 概述

本文档描述 FinMark AI Kong API Gateway 的配置完善方案。

## 技术选型

| 功能 | 选择 |
|------|------|
| 认证 | API Key (服务间) + JWT (用户) |
| 限流 | 基础限流 (按 IP/消费者) |
| 监控 | 完整监控 (日志 + 指标 + 追踪) |
| 安全 | 企业级 (CORS + 请求大小 + IP黑名单 + 安全头 + mTLS) |

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Kong Gateway                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Auth       │  │ Rate Limit  │  │  Logging   │       │
│  │  - API Key  │  │  - 100/min  │  │  - Request │       │
│  │  - JWT      │  │  - Burst    │  │  - Error   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Security   │  │  Transform  │  │  Cache     │       │
│  │  - CORS     │  │  - Headers  │  │  - Redis   │       │
│  │  - Size     │  │  - Response │  │             │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
├─────────────────────────────────────────────────────────┤
│  Services: Agent, LLM Gateway, Data                      │
└─────────────────────────────────────────────────────────┘
```

## 插件配置

### 1. 认证插件

```yaml
plugins:
  # JWT 认证 (用户认证)
  - name: jwt
    config:
      key_claim_name: kid
      claims_to_verify:
        - exp
      maximum_expiration: 3600

  # API Key 认证 (服务间)
  - name: key-auth
    config:
      key_names:
        - x-api-key
      key_in_header: true
```

### 2. 限流插件

```yaml
plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
      policy: local
      fault_tolerant: true
      hide_client_headers: false
```

### 3. 日志和监控

```yaml
plugins:
  # HTTP 日志
  - name: http-log
    config:
      log_level: info
      method: POST
      url: http://logging-service:5000/logs

  # Prometheus 指标
  - name: prometheus
    config:
      per_consumer: true
```

### 4. 安全插件

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
      headers:
        - Authorization
        - Content-Type
      exposed_headers:
        - X-Total-Count
      credentials: true
      max_age: 3600

  # 请求大小限制
  - name: request-size-limiting
    config:
      allowed_payload_size: 128
      size_unit: megabytes

  # IP 黑名单
  - name: ip-restriction
    config:
      allow:
        - 127.0.0.1
        - 10.0.0.0/8
      deny:
        - 192.168.1.100
```

### 5. 安全头插件

```yaml
plugins:
  - name: headers-more
    config:
      set:
        - name: X-Frame-Options
          value: DENY
        - name: X-Content-Type-Options
          value: nosniff
        - name: Strict-Transport-Security
          value: max-age=31536000; includeSubDomains
        - name: Content-Security-Policy
          value: default-src 'self'
```

## 服务路由配置

```yaml
services:
  # Agent Service
  - name: agent-service
    url: http://agent-service:3001
    routes:
      - name: agent-route
        paths:
          - /api/agents
        methods:
          - GET
          - POST
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 100
      - name: cors
      - name: headers-more

  # LLM Gateway
  - name: llm-gateway
    url: http://llm-gateway:3002
    routes:
      - name: llm-route
        paths:
          - /api/llm
    plugins:
      - name: key-auth
      - name: rate-limiting
        config:
          minute: 50
      - name: request-size-limiting

  # Data Service
  - name: data-service
    url: http://data-service:3003
    routes:
      - name: data-route
        paths:
          - /api/data
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 200
      - name: cors
```

## 消费者配置

```yaml
consumers:
  # 前端应用
  - username: frontend
    jwt:
      key: frontend-key
      algorithm: RS256
    plugins:
      - name: rate-limiting
        config:
          minute: 100

  # 内部服务
  - username: agent-service
    keyauth_credentials:
      - key: agent-service-api-key
    plugins:
      - name: rate-limiting
        config:
          minute: 1000

  # 客户经理
  - username: rm-app
    jwt:
      key: rm-key
      algorithm: RS256
    plugins:
      - name: rate-limiting
        config:
          minute: 50
```
