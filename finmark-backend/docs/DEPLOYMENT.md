# FinMark 后端安装部署指南

## 目录

- [前置要求](#前置要求)
- [本地开发环境](#本地开发环境)
- [生产环境部署 (Kubernetes)](#生产环境部署-kubernetes)
- [配置说明](#配置说明)
- [验证部署](#验证部署)
- [常见问题](#常见问题)

---

## 前置要求

### 必需软件

| 软件 | 版本 | 说明 |
|------|------|------|
| Docker | 24.0+ | 容器运行时 |
| Docker Compose | 2.20+ | 容器编排 |
| Node.js | 20.x | 本地开发 |
| kubectl | 1.28+ | K8s CLI |
| kustomize | 5.0+ | K8s 配置管理 |

### 基础设施

- PostgreSQL 15
- Redis 7
- Kong API Gateway 3.4

---

## 本地开发环境

### 1. 克隆代码

```bash
# 切换到后端开发分支
git checkout backend-dev
cd .worktrees/backend/finmark-backend
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的环境变量
vim .env
```

### 3. 启动服务

```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 4. 服务端口

| 服务 | 端口 | URL |
|------|------|-----|
| Kong Gateway | 8000 | http://localhost:8000 |
| Kong Admin | 8001 | http://localhost:8001 |
| Agent Service | 3001 | http://localhost:3001 |
| LLM Gateway | 3002 | http://localhost:3002 |
| Data Service | 3003 | http://localhost:3003 |
| Workflow Service | 3005 | http://localhost:3005 |
| Integration Service | 3006 | http://localhost:3006 |

### 5. 访问 API

```bash
# 通过 Kong 访问各服务
curl http://localhost:8000/api/agents
curl http://localhost:8000/api/llm/chat
curl http://localhost:8000/api/data/scenarios
curl http://localhost:8000/api/workflows
curl http://localhost:8000/api/crm/contacts
```

---

## 生产环境部署 (Kubernetes)

### 1. 前置准备

```bash
# 确保 Kubernetes 集群可访问
kubectl cluster-info

# 创建命名空间
kubectl create namespace finmark
```

### 2. 部署配置

#### 开发环境

```bash
# 进入后端目录
cd .worktrees/backend/finmark-backend

# 部署开发环境
kubectl apply -k k8s/overlays/dev

# 查看部署状态
kubectl get pods -n finmark-dev
```

#### 生产环境

```bash
# 部署生产环境
kubectl apply -k k8s/overlays/prod

# 查看部署状态
kubectl get pods -n finmark-prod
```

### 3. 检查服务

```bash
# 查看所有资源
kubectl get all -n finmark

# 查看 Ingress
kubectl get ingress -n finmark

# 查看 ConfigMap
kubectl get configmap -n finmark

# 查看 Secrets (需手动创建)
kubectl get secrets -n finmark
```

### 4. 访问服务

```bash
# 通过 Ingress 访问 (需配置 DNS)
# 将 api.finmark.example.com 指向 Ingress IP

curl https://api.finmark.example.com/api/agents
curl https://api.finmark.example.com/api/workflows
```

---

## 配置说明

### 环境变量

#### Agent Service

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务端口 |
| `LLM_GATEWAY_URL` | http://llm-gateway:3002 | LLM 网关地址 |

#### LLM Gateway

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3002 | 服务端口 |
| `LLM_PROVIDER` | openai | LLM 提供商 |
| `LLM_API_KEY` | - | API Key |

#### Data Service

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3003 | 服务端口 |
| `DATABASE_URL` | postgresql://... | 数据库连接串 |

#### Workflow Service

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3005 | 服务端口 |
| `AGENT_SERVICE_URL` | http://agent-service:3001 | Agent 服务地址 |

#### Integration Service

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3006 | 服务端口 |
| `CRM_ENABLED` | true | 启用 CRM |
| `CRM_PROVIDER` | custom | CRM 提供商 |
| `RIGHTS_ENABLED` | true | 启用权限系统 |
| `RIGHTS_PROVIDER` | custom | 权限系统提供商 |

### Kong 配置

#### 认证方式

| 服务 | 认证方式 |
|------|----------|
| agent-service | JWT |
| llm-gateway | API Key |
| data-service | JWT |
| workflow-service | JWT |
| integration-service | API Key |

#### 限流配置

| 服务 | 每分钟限制 |
|------|-----------|
| agent-service | 100 |
| llm-gateway | 50 |
| data-service | 200 |
| workflow-service | 50 |
| integration-service | 100 |

### Kubernetes 资源配置

#### 资源请求/限制

| 服务 | CPU 请求 | CPU 限制 | 内存请求 | 内存限制 |
|------|---------|---------|---------|---------|
| Kong | 200m | 500m | 256Mi | 512Mi |
| agent-service | 250m | 500m | 256Mi | 512Mi |
| llm-gateway | 250m | 500m | 256Mi | 512Mi |
| data-service | 250m | 500m | 256Mi | 512Mi |
| workflow-service | 250m | 500m | 256Mi | 512Mi |
| integration-service | 250m | 500m | 256Mi | 512Mi |
| PostgreSQL | 250m | 1000m | 256Mi | 1Gi |
| Redis | 100m | 250m | 128Mi | 512Mi |

#### 副本数

| 环境 | Kong | 微服务 | 数据库 |
|------|------|--------|--------|
| dev | 2 | 2 | 1 |
| prod | 2 | 5 | 1 |

---

## 验证部署

### 本地环境验证

```bash
# 1. 检查容器运行状态
docker-compose ps

# 2. 检查服务健康状态
curl http://localhost:8000/api/agents
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3005/health
curl http://localhost:3006/health

# 3. 测试 API 认证
# JWT 认证
curl -H "Authorization: Bearer <jwt_token>" http://localhost:8000/api/data/scenarios

# API Key 认证
curl -H "x-api-key: <api_key>" http://localhost:8000/api/llm/chat
```

### 生产环境验证

```bash
# 1. 检查 Pod 状态
kubectl get pods -n finmark

# 2. 检查服务日志
kubectl logs -n finmark -l app=agent-service
kubectl logs -n finmark -l app=kong

# 3. 检查服务健康
kubectl exec -it <pod-name> -n finmark -- curl http://localhost:3001/health

# 4. 检查 Ingress
kubectl describe ingress finmark-ingress -n finmark

# 5. 测试外部访问
curl https://api.finmark.example.com/api/agents
```

### 预设工作流测试

```bash
# 列出所有工作流
curl http://localhost:8000/api/workflows

# 执行工作流
curl -X POST http://localhost:8000/api/workflows/marketing-campaign/execute \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"context": {}}'
```

---

## 常见问题

### Docker Compose

#### Q: 容器启动失败

```bash
# 查看日志
docker-compose logs <service-name>

# 重新构建
docker-compose build <service-name>
docker-compose up -d <service-name>
```

#### Q: 端口冲突

```bash
# 检查端口占用
lsof -i :8000

# 修改 docker-compose.yml 中的端口映射
```

### Kubernetes

#### Q: Pod 一直处于 Pending

```bash
# 查看事件
kubectl describe pod <pod-name> -n finmark

# 检查 PVC 状态
kubectl get pvc -n finmark
```

#### Q: ImagePullBackOff

```bash
# 确保镜像已构建并推送到仓库
# 或修改 k8s 配置使用本地镜像
```

#### Q: 服务间无法通信

```bash
# 检查 Service
kubectl get svc -n finmark

# 检查 DNS 解析
kubectl exec -it <pod-name> -n finmark -- nslookup <service-name>
```

### Kong

#### Q: 认证失败

```bash
# 检查 Kong 日志
kubectl logs -n finmark -l app=kong

# 验证消费者配置
curl http://localhost:8001/consumers
```

#### Q: 限流不生效

```bash
# 检查 Redis 连接
kubectl exec -it redis-<pod> -n finmark -- redis-cli ping

# 验证限流插件配置
curl http://localhost:8001/plugins
```

---

## 快速命令参考

```bash
# 本地开发
docker-compose up -d                  # 启动
docker-compose logs -f                 # 查看日志
docker-compose restart <service>       # 重启服务
docker-compose down                    # 停止

# Kubernetes
kubectl apply -k k8s/overlays/prod      # 部署
kubectl rollout restart deployment -n finmark  # 重启
kubectl delete -k k8s/overlays/prod    # 删除

# 调试
kubectl get pods -n finmark             # 查看 Pod
kubectl logs -f <pod> -n finmark       # 查看日志
kubectl exec -it <pod> -n finmark -- /bin/sh  # 进入容器
```
