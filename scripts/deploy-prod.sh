#!/bin/bash

# FinMark Production Deployment Script
# Usage: ./deploy-prod.sh

set -e

echo "🚀 Starting FinMark Production Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is required but not installed."
        exit 1
    fi
}

# Check prerequisites
log_info "Checking prerequisites..."
check_command docker
check_command docker-compose
check_command git
check_command pnpm

# Step 1: Pull latest code
log_info "Pulling latest code from repository..."
git pull origin main

# Step 2: Copy environment files
log_info "Setting up environment files..."
if [ ! -f finmark-backend/services/data-service/.env ]; then
    log_info "Creating .env from .env.example..."
    cp finmark-backend/services/data-service/.env.example \
       finmark-backend/services/data-service/.env
    log_warn "Please edit finmark-backend/services/data-service/.env with production values"
    log_warn "Press any key to continue after editing..."
    read -n 1
fi

# Step 3: Start services
log_info "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Step 4: Health checks
log_info "Running health checks..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    log_info "✅ Backend health check passed"
else
    log_error "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_info "✅ Frontend health check passed"
else
    log_error "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Step 5: Verify database migrations
log_info "Verifying database migrations..."
docker-compose exec -T backend npx prisma migrate status

# Step 6: Run smoke tests
log_info "Running smoke tests..."

# Test login endpoint
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    log_info "✅ Login test passed"
else
    log_warn "⚠️  Login test failed (expected if admin user doesn't exist)"
fi

# Test scenario endpoint
SCENARIO_RESPONSE=$(curl -s http://localhost:3001/api/scenarios)
if echo "$SCENARIO_RESPONSE" | grep -q "success"; then
    log_info "✅ Scenario API test passed"
else
    log_error "❌ Scenario API test failed"
    exit 1
fi

# Test expert endpoint
EXPERT_RESPONSE=$(curl -s http://localhost:3001/api/expert/workflows)
if echo "$EXPERT_RESPONSE" | grep -q "success"; then
    log_info "✅ Expert API test passed"
else
    log_error "❌ Expert API test failed"
    exit 1
fi

# Step 7: Display deployment info
log_info "Deployment completed successfully!"
echo ""
echo "======================================"
echo "  FinMark Production Deployment      "
echo "======================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "Health:   http://localhost:3001/health"
echo ""
echo "======================================"
echo ""

# Display service status
log_info "Service status:"
docker-compose ps

# Display next steps
log_info "Next steps:"
echo "1. Update DNS records to point to production server"
echo "2. Configure SSL/TLS certificates"
echo "3. Set up monitoring and alerting"
echo "4. Configure backup strategy"
echo "5. Run full regression tests"
echo ""

log_info "Deployment complete! 🎉"
