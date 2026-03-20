# FinMark 完整部署指南

**版本**: 1.0.0  
**更新日期**: 2026-03-20  
**生产就绪度**: 98%

---

## 📋 **目录**

1. [部署前准备](#1-部署前准备)
2. [环境配置](#2-环境配置)
3. [数据库部署](#3-数据库部署)
4. [应用部署](#4-应用部署)
5. [Docker 部署](#5-docker-部署)
6. [验证部署](#6-验证部署)
7. [监控与维护](#7-监控与维护)
8. [故障排查](#8-故障排查)
9. [回滚方案](#9-回滚方案)

---

## 1. 部署前准备

### **1.1 系统要求**

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| **CPU** | 2 核 | 4 核 |
| **内存** | 4 GB | 8 GB |
| **磁盘** | 20 GB | 50 GB SSD |
| **操作系统** | Linux/macOS | Ubuntu 20.04+ |

### **1.2 依赖软件**

```bash
# 检查 Docker
docker --version
# 预期：Docker version 20.10.0+

# 检查 Docker Compose
docker-compose --version
# 预期：docker-compose version 1.29.0+

# 检查 Git
git --version
# 预期：git version 2.30.0+

# 检查 Node.js (本地开发)
node --version
# 预期：v18.0.0+

# 检查 PNPM (本地开发)
pnpm --version
# 预期：8.0.0+
```

### **1.3 网络要求**

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Frontend | Next.js 应用 |
| 3001 | Backend | Express API |
| 5432 | PostgreSQL | 数据库（可内部） |
| 6379 | Redis | 缓存（可内部） |

---

## 2. 环境配置

### **2.1 创建环境变量文件**

```bash
# 导航到项目目录
cd /Users/xinjian/Work/Project/RD/FinMark

# 复制后端环境模板
cp finmark-backend/services/data-service/.env.example \
   finmark-backend/services/data-service/.env
```

### **2.2 配置后端环境变量**

编辑 `finmark-backend/services/data-service/.env`:

```bash
# ==================== 数据库配置 ====================
DATABASE_URL="postgresql://finmark:STRONG_PASSWORD@localhost:5432/finmark?schema=public"

# ==================== Redis 配置 ====================
REDIS_URL="redis://localhost:6379"

# ==================== 认证配置 ====================
# 生成强随机密钥：openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"

# ==================== 服务配置 ====================
PORT=3001
NODE_ENV="production"

# ==================== CORS 配置 ====================
# 生产环境设置为实际域名
CORS_ORIGIN="https://finmark.yourbank.com"

# ==================== CRM 集成（可选） ====================
CRM_BASE_URL="https://crm.yourbank.com/api"
CRM_API_KEY="your-crm-api-key"
CRM_TIMEOUT=5000
CRM_RETRY_ATTEMPTS=3
CRM_CACHE_TTL=300

# ==================== 大数据平台（可选） ====================
BIG_DATA_GRAPHQL_URL="https://bigdata.yourbank.com/graphql"
BIG_DATA_API_KEY="your-bigdata-api-key"
BIG_DATA_TIMEOUT=10000

# ==================== 日志配置 ====================
LOG_LEVEL="info"
LOG_FORMAT="json"
```

### **2.3 配置前端环境变量**

创建 `frontend/.env.local`:

```bash
# API 地址
NEXT_PUBLIC_API_URL="https://api.finmark.yourbank.com"

# 应用配置
NEXT_PUBLIC_APP_NAME="FinMark 智能营销平台"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### **2.4 生成安全密钥**

```bash
# 生成 JWT_SECRET
openssl rand -base64 32

# 生成数据库密码
openssl rand -base64 16

# 示例输出：
# JWT_SECRET="xK9mP2vL8nQ4wR6tY1uI3oA5sD7fG0hJ2kL4mN6pQ8rT0vW2xZ4aB6cD8eF0gH2"
# POSTGRES_PASSWORD="aB3dE6gH9jK2mN5p"
```

---

## 3. 数据库部署

### **3.1 方法 1: Docker 部署（推荐）**

```bash
# 启动 PostgreSQL
docker run -d \
  --name finmark-postgres \
  -e POSTGRES_USER=finmark \
  -e POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD \
  -e POSTGRES_DB=finmark \
  -p 5432:5432 \
  -v finmark_postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# 验证启动
docker ps | grep finmark-postgres
```

### **3.2 方法 2: 本地安装**

**Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### **3.3 创建数据库**

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库和用户
CREATE DATABASE finmark;
CREATE USER finmark WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE finmark TO finmark;
\q
```

### **3.4 运行数据库迁移**

```bash
cd finmark-backend/services/data-service

# 应用所有迁移
npx prisma migrate deploy

# 生成 Prisma 客户端
npx prisma generate

# 验证迁移状态
npx prisma migrate status
```

---

## 4. 应用部署

### **4.1 后端部署**

#### **步骤 1: 安装依赖**

```bash
cd finmark-backend/services/data-service

# 生产环境（仅安装生产依赖）
pnpm install --prod

# 或完整安装（包含开发依赖）
pnpm install
```

#### **步骤 2: 构建应用**

```bash
# 编译 TypeScript
pnpm build

# 验证构建输出
ls -la dist/
```

#### **步骤 3: 启动服务**

```bash
# 生产环境启动
pnpm start

# 或使用 PM2（推荐）
pnpm install -g pm2
pm2 start dist/index.js --name finmark-backend
pm2 save
pm2 startup
```

#### **步骤 4: 验证启动**

```bash
# 检查进程
ps aux | grep finmark

# 检查端口
netstat -tlnp | grep 3001

# 健康检查
curl http://localhost:3001/health
```

### **4.2 前端部署**

#### **步骤 1: 安装依赖**

```bash
cd /Users/xinjian/Work/Project/RD/FinMark

pnpm install --frozen-lockfile
```

#### **步骤 2: 构建应用**

```bash
# 生产构建
pnpm build

# 验证构建
ls -la .next/
```

#### **步骤 3: 启动服务**

```bash
# 生产环境启动
pnpm start

# 或使用 PM2
pm2 start npm --name finmark-frontend -- start
pm2 save
```

---

## 5. Docker 部署

### **5.1 使用 Docker Compose（推荐）**

```bash
cd /Users/xinjian/Work/Project/RD/FinMark

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### **5.2 服务管理**

```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend

# 进入容器
docker-compose exec backend bash
docker-compose exec frontend bash
```

### **5.3 数据备份**

```bash
# 备份 PostgreSQL 数据
docker-compose exec postgres pg_dump -U finmark finmark > backup_$(date +%Y%m%d).sql

# 恢复数据
docker-compose exec -T postgres psql -U finmark finmark < backup_20260320.sql
```

---

## 6. 验证部署

### **6.1 健康检查**

```bash
# 后端健康
curl -f http://localhost:3001/health
# 预期：{"status":"ok","service":"data-service","database":"connected"}

# 前端健康
curl -f http://localhost:3000
# 预期：HTTP 200

# Redis 连接
docker-compose exec redis redis-cli ping
# 预期：PONG

# PostgreSQL 连接
docker-compose exec postgres pg_isready -U finmark
# 预期：accepting connections
```

### **6.2 功能测试**

```bash
# 1. 测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. 测试场景 API
curl http://localhost:3001/api/scenarios

# 3. 测试告警 API
curl http://localhost:3001/api/alarms/rules

# 4. 测试专家模式 API
curl http://localhost:3001/api/expert/workflows

# 5. 测试报表 API
curl http://localhost:3001/api/reports
```

### **6.3 性能测试**

```bash
# 使用 Apache Bench 测试
ab -n 1000 -c 10 http://localhost:3001/health

# 预期结果：
# Requests per second: >100
# Time per request: <100ms
```

---

## 7. 监控与维护

### **7.1 日志管理**

```bash
# 查看实时日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 日志轮转配置（/etc/logrotate.d/finmark）
/var/log/finmark/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
}
```

### **7.2 监控指标**

| 指标 | 阈值 | 告警 |
|------|------|------|
| **CPU 使用率** | <70% | >90% |
| **内存使用率** | <80% | >95% |
| **磁盘使用率** | <80% | >90% |
| **API 响应时间** | <500ms | >2s |
| **错误率** | <1% | >5% |

### **7.3 备份策略**

```bash
# 创建备份脚本（/usr/local/bin/finmark-backup.sh）
#!/bin/bash
BACKUP_DIR="/backups/finmark"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
docker-compose exec postgres pg_dump -U finmark finmark > ${BACKUP_DIR}/db_${DATE}.sql

# 压缩备份
tar -czf ${BACKUP_DIR}/backup_${DATE}.tar.gz ${BACKUP_DIR}/db_${DATE}.sql

# 清理 7 天前的备份
find ${BACKUP_DIR} -name "backup_*.tar.gz" -mtime +7 -delete

# 设置 cron 任务（每天凌晨 2 点）
0 2 * * * /usr/local/bin/finmark-backup.sh
```

---

## 8. 故障排查

### **8.1 常见问题**

#### **问题 1: 后端无法启动**

```bash
# 检查日志
docker-compose logs backend

# 可能原因：
# 1. 数据库连接失败
# 2. 端口被占用
# 3. 环境变量配置错误

# 解决方案：
# 1. 检查 DATABASE_URL 配置
# 2. 检查端口：netstat -tlnp | grep 3001
# 3. 验证 .env 文件
```

#### **问题 2: 数据库迁移失败**

```bash
# 检查迁移状态
npx prisma migrate status

# 重置迁移（谨慎使用）
npx prisma migrate reset

# 手动修复
npx prisma db pull
npx prisma generate
```

#### **问题 3: Redis 连接失败**

```bash
# 检查 Redis 状态
docker-compose ps redis

# 测试连接
docker-compose exec redis redis-cli ping

# 重启 Redis
docker-compose restart redis
```

### **8.2 调试模式**

```bash
# 启用详细日志
NODE_ENV=development LOG_LEVEL=debug pnpm start

# Prisma 查询日志
export DEBUG=prisma:client
pnpm start
```

---

## 9. 回滚方案

### **9.1 应用回滚**

```bash
# Docker 回滚
docker-compose down
git checkout <previous_version>
docker-compose up -d

# PM2 回滚
pm2 restart all --update-env
```

### **9.2 数据库回滚**

```bash
# 回滚最后一次迁移
npx prisma migrate resolve --rolled-back <migration_name>

# 从备份恢复
psql -U finmark finmark < backup_20260320.sql
```

### **9.3 蓝绿部署（推荐）**

```bash
# 1. 部署到绿色环境
docker-compose -f docker-compose.green.yml up -d

# 2. 验证绿色环境
curl http://localhost:3002/health

# 3. 切换流量（更新 Nginx 配置）
# 4. 重启 Nginx
sudo systemctl restart nginx

# 5. 观察一段时间
# 6. 停止蓝色环境
docker-compose -f docker-compose.blue.yml down
```

---

## 📞 **技术支持**

**文档维护**: DevOps Team  
**最后更新**: 2026-03-20  
**下次审查**: 部署后 1 周

---

**🎉 部署完成！如有问题请参考故障排查章节或联系技术支持。**
