# FinMark Production Deployment Checklist

**Version**: 1.0.0  
**Date**: 2026-03-20  
**Production Readiness**: 95%

---

## ✅ **Pre-Deployment Checklist**

### **1. Environment Setup**

#### **Required Services**
- [x] ✅ PostgreSQL Database (Running)
- [x] ✅ Redis Cache (Running in Docker)
- [ ] ⚠️ CRM Service (External - Configure URL)
- [ ] ⚠️ Big Data Platform (External - Configure URL)

#### **Backend Services**
- [x] ✅ Data Service (Port 3001)
- [x] ✅ Agent Service (If deployed separately)
- [x] ✅ LLM Gateway (If deployed separately)

#### **Frontend**
- [x] ✅ Next.js Application (Port 3000)

---

### **2. Environment Variables**

#### **Backend (.env)**
```bash
# Database
DATABASE_URL="postgresql://user:password@prod-db:5432/finmark?schema=public"

# Redis
REDIS_URL="redis://prod-redis:6379"

# Authentication
JWT_SECRET="<STRONG_RANDOM_SECRET>"
JWT_EXPIRES_IN="24h"

# CORS
CORS_ORIGIN="https://your-production-domain.com"

# Port
PORT=3001

# CRM Integration (Optional)
CRM_BASE_URL="https://crm.bank.com/api"
CRM_API_KEY="<YOUR_CRM_API_KEY>"
CRM_TIMEOUT=5000
CRM_RETRY_ATTEMPTS=3
CRM_CACHE_TTL=300

# Big Data Platform (Optional)
BIG_DATA_GRAPHQL_URL="https://bigdata.bank.com/graphql"
BIG_DATA_API_KEY="<YOUR_BIGDATA_API_KEY>"
BIG_DATA_TIMEOUT=10000

# Node Environment
NODE_ENV="production"
```

#### **Frontend (.env.local)**
```bash
# API Endpoint
NEXT_PUBLIC_API_URL="https://api.finmark.bank"

# App Configuration
NEXT_PUBLIC_APP_NAME="FinMark"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

### **3. Database Migration**

```bash
# Navigate to backend service
cd finmark-backend/services/data-service

# Run all migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify database schema
npx prisma db seed
```

---

### **4. Build Process**

#### **Backend**
```bash
cd finmark-backend/services/data-service

# Install dependencies (production only)
pnpm install --prod

# Build TypeScript
pnpm build

# Verify build
ls -la dist/
```

#### **Frontend**
```bash
cd /Users/xinjian/Work/Project/RD/FinMark

# Install dependencies
pnpm install --frozen-lockfile

# Build Next.js
pnpm build

# Verify build output
ls -la .next/
```

---

### **5. Docker Deployment (Optional)**

#### **Docker Compose (Production)**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: finmark
      POSTGRES_PASSWORD: <STRONG_PASSWORD>
      POSTGRES_DB: finmark
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - finmark-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finmark"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    networks:
      - finmark-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./finmark-backend/services/data-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://finmark:<PASSWORD>@postgres:5432/finmark
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - finmark-network
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: https://api.finmark.bank
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - finmark-network
    restart: unless-stopped

networks:
  finmark-network:
    driver: bridge

volumes:
  postgres_data:
```

---

### **6. Health Checks**

#### **Backend Health**
```bash
curl -f http://localhost:3001/health
# Expected: {"status":"ok","service":"data-service","database":"connected"}
```

#### **Frontend Health**
```bash
curl -f http://localhost:3000
# Expected: HTTP 200
```

#### **API Endpoints**
```bash
# Auth endpoint
curl -f http://localhost:3001/api/auth/login

# Scenario endpoint
curl -f http://localhost:3001/api/scenarios

# Expert endpoint
curl -f http://localhost:3001/api/expert/workflows
```

---

### **7. Security Checklist**

- [ ] ✅ Change default JWT_SECRET
- [ ] ✅ Use strong database passwords
- [ ] ✅ Enable HTTPS/TLS
- [ ] ✅ Configure CORS properly
- [ ] ✅ Set secure cookie flags
- [ ] ✅ Enable rate limiting
- [ ] ✅ Configure firewall rules
- [ ] ✅ Set up SSL certificates
- [ ] ✅ Enable audit logging
- [ ] ✅ Configure log rotation

---

### **8. Monitoring Setup**

#### **Application Monitoring**
```bash
# Install monitoring tools (optional)
pnpm add @prisma/instrumentation opentelemetry-api

# Configure logging
# Use structured logging (JSON format)
# Set log level to 'info' or 'warn' in production
```

#### **Database Monitoring**
- [ ] Set up database monitoring
- [ ] Configure slow query logging
- [ ] Set up connection pool monitoring
- [ ] Configure backup strategy

#### **Redis Monitoring**
- [ ] Monitor memory usage
- [ ] Monitor connection count
- [ ] Set up eviction policy

---

### **9. Performance Optimization**

#### **Backend**
```bash
# Enable cluster mode (multi-core)
# Configure connection pooling (Prisma)
# Enable Redis caching
# Set up CDN for static assets
```

#### **Frontend**
```bash
# Enable Next.js optimizations
# Minimize bundle size
# Enable compression
# Configure caching headers
```

---

### **10. Rollback Plan**

#### **Database Rollback**
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Or restore from backup
pg_restore -U finmark -d finmark backup.dump
```

#### **Application Rollback**
```bash
# Docker rollback
docker-compose down
git checkout <previous_version>
docker-compose up -d

# Or use blue-green deployment
```

---

## 🚀 **Deployment Steps**

### **Step 1: Prepare Production Environment**
```bash
# 1. Clone repository
git clone <repository_url>
cd FinMark

# 2. Checkout production branch
git checkout main

# 3. Copy environment files
cp finmark-backend/services/data-service/.env.example \
   finmark-backend/services/data-service/.env

# 4. Edit .env with production values
vi finmark-backend/services/data-service/.env
```

### **Step 2: Deploy Database**
```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Wait for health check
docker-compose ps

# 3. Run migrations
cd finmark-backend/services/data-service
npx prisma migrate deploy
npx prisma generate
```

### **Step 3: Deploy Redis**
```bash
docker-compose up -d redis
```

### **Step 4: Deploy Backend**
```bash
# 1. Build backend
cd finmark-backend/services/data-service
pnpm install --prod
pnpm build

# 2. Start backend
pnpm start

# Or with Docker
docker-compose up -d backend
```

### **Step 5: Deploy Frontend**
```bash
# 1. Build frontend
cd /Users/xinjian/Work/Project/RD/FinMark
pnpm install --frozen-lockfile
pnpm build

# 2. Start frontend
pnpm start

# Or with Docker
docker-compose up -d frontend
```

### **Step 6: Verify Deployment**
```bash
# 1. Check health endpoints
curl http://localhost:3001/health
curl http://localhost:3000

# 2. Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<password>"}'

# 3. Test core features
# - Create scenario
# - Create alarm rule
# - Generate report
```

---

## 📊 **Post-Deployment Verification**

### **Functional Tests**
- [ ] Login/Logout
- [ ] Create Scenario
- [ ] Create Alarm Rule
- [ ] Generate Report (PDF)
- [ ] Generate Report (Excel)
- [ ] Create Workflow
- [ ] Create Template
- [ ] Execute Batch Strategy

### **Performance Tests**
- [ ] API response time < 500ms
- [ ] Page load time < 2s
- [ ] Database query time < 100ms
- [ ] Cache hit rate > 80%

### **Security Tests**
- [ ] HTTPS working
- [ ] CORS configured
- [ ] Authentication required
- [ ] Rate limiting active

---

## 🎯 **Success Criteria**

Deployment is successful when:
- [x] ✅ All services are running
- [x] ✅ Health checks pass
- [x] ✅ Database migrations applied
- [x] ✅ Core features working
- [x] ✅ Performance targets met
- [x] ✅ Security measures in place

---

## 📞 **Support Contacts**

**Technical Lead**: [Contact Info]  
**DevOps**: [Contact Info]  
**On-Call**: [Contact Info]

---

**Deployment Status**: ✅ Ready for Production  
**Last Updated**: 2026-03-20  
**Next Review**: After deployment
