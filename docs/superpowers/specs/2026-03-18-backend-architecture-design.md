# FinMark AI 后端技术架构设计

## 概述

本文档描述 FinMark AI 后端微服务架构选型。

## 技术栈

| 模块 | 选择 |
|------|------|
| 架构模式 | 微服务 |
| 服务拆分 | API Gateway + Agent Service + Data Service + Workflow Engine + LLM Gateway |
| 服务通信 | HTTP/REST |
| API Gateway | Kong |
| 部署方式 | Docker Compose (开发) + Kubernetes (生产) |

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      Kong Gateway                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Agent Svc   │  │ Workflow Svc  │  │ LLM Gateway│ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  Data Svc   │  │  Gateway Svc  │                   │
│  └──────────────┘  └──────────────┘                   │
├─────────────────────────────────────────────────────────┤
│                   PostgreSQL + Redis                     │
└─────────────────────────────────────────────────────────┘
```

## 服务职责

| 服务 | 职责 |
|------|------|
| Kong Gateway | 路由、认证、限流、日志 |
| Agent Service | LangChain/LangGraph 智能体编排 |
| Workflow Service | 工作流编排、状态管理 |
| LLM Gateway | 模型路由、负载均衡、成本统计 |
| Data Service | Prisma ORM、数据 CRUD |
| Gateway Service | 外部系统集成 (CRM, 权益系统) |

## 部署架构

### 开发环境 (Docker Compose)

```yaml
services:
  kong:
    image: kong:latest
  agent-service:
    build: ./agent-service
  workflow-service:
    build: ./workflow-service
  data-service:
    build: ./data-service
  postgres:
    image: postgres:15
  redis:
    image: redis:7
```

### 生产环境 (Kubernetes)

- 使用 Helm Chart 部署各服务
- Kong Ingress Controller
- HPA 自动扩缩容
- Prometheus + Grafana 监控
