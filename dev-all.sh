#!/bin/bash

# Daleel Balady - Start All Local Development Services
# This script starts all required services for local development

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Daleel Balady - Starting All Development Services${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port (Hard Kill)
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔄 Killing process on port $port...${NC}"
    
    # Try fuser first (more reliable on Linux)
    if command -v fuser &> /dev/null; then
        fuser -k -9 $port/tcp >/dev/null 2>&1 || true
    fi
    
    # Try lsof as backup
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Wait for port to be free
    local attempts=0
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; do
        sleep 0.5
        attempts=$((attempts+1))
        if [ $attempts -gt 10 ]; then
             echo -e "${RED}⚠️ Failed to clear port $port. Attempting generic cleanup...${NC}"
             # Last resort: kill all node processes related to this port if possible, or just warn
             break
        fi
    done
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service to start
wait_for_service() {
    local port=$1
    local name=$2
    echo -e "${YELLOW}⏳ Waiting for $name (Port $port) to be ready...${NC}"
    local retries=0
    while ! check_port $port; do
        sleep 1
        retries=$((retries+1))
        if [ $retries -gt 30 ]; then
             echo -e "${RED}❌ Timeout waiting for $name${NC}"
             return 1
        fi
    done
    echo -e "${GREEN}✓ $name is ready!${NC}"
}

# Check for Go
if command -v go &> /dev/null && [ -d "apps/delivery-service" ]; then
    HAS_GO=true
    echo -e "${GREEN}✓ Go detected, Delivery Service enabled${NC}"
else
    HAS_GO=false
    echo -e "${YELLOW}⚠️ Go not found or apps/delivery-service missing. Skipping Delivery Service.${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 2: Cleaning Up Old Processes & Cache${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill known processes by name first
pkill -f "next dev" || true
pkill -f "node src/server.js" || true
pkill -f "node index.js" || true
pkill -f "node --watch" || true

# Clean up ports
PORTS_TO_CHECK=(3001 3002 3003 3004 3005 3006 3007 3008 4000 5000 5002 5003 5004)
for port in "${PORTS_TO_CHECK[@]}"; do
    kill_port $port
done

# Remove stale Next.js locks and cache (Fixes Turbopack issues)
echo -e "${YELLOW}🧹 Cleaning stale locks and cache...${NC}"
find apps -name ".next" -type d -exec rm -rf {} \; 2>/dev/null || true
echo -e "${GREEN}✓ Cache cleaned${NC}"

echo ""
echo -e "${BLUE}📋 Step 3: Installing Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
    pnpm install
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 4: Generating Prisma Client${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
cd packages/database
pnpm run generate
cd ../..
echo -e "${GREEN}✓ Prisma Client generated${NC}"

echo ""
echo -e "${BLUE}📋 Step 5: Starting Services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create logs directory
mkdir -p logs

getPid() {
    echo $!
}

# --- Microservices (Sequenced) ---

echo -e "${GREEN}🚀 Starting API Gateway (3001)...${NC}"
PORT=3001 pnpm --filter api-gateway dev > logs/api-gateway.log 2>&1 &
GATEWAY_PID=$!
echo -e "${GREEN}   PID: $GATEWAY_PID${NC}"

# Wait for core infrastructure services
wait_for_service 3001 "API Gateway"

echo -e "${GREEN}🚀 Starting Auth Service (3002)...${NC}"
PORT=3002 pnpm --filter auth-service dev > logs/auth-service.log 2>&1 &
AUTH_PID=$!
echo -e "${GREEN}   PID: $AUTH_PID${NC}"

echo -e "${GREEN}🚀 Starting User Service (3003)...${NC}"
PORT=3003 pnpm --filter user-service dev > logs/user-service.log 2>&1 &
USER_PID=$!
echo -e "${GREEN}   PID: $USER_PID${NC}"


if [ "$HAS_GO" = true ]; then
    echo -e "${GREEN}🚀 Starting Delivery Service (Go) (3004)...${NC}"
    # Start Go service in background and capture PID properly
    (cd apps/delivery-service && PORT=3004 go run . > ../../logs/delivery-service.log 2>&1) &
    DELIVERY_PID=$!
    echo -e "${GREEN}   PID: $DELIVERY_PID${NC}"
fi


echo -e "${GREEN}🚀 Starting Finance Service (3005)...${NC}"
PORT=3005 pnpm --filter finance-service dev > logs/finance-service.log 2>&1 &
FINANCE_PID=$!
echo -e "${GREEN}   PID: $FINANCE_PID${NC}"

echo -e "${GREEN}🚀 Starting Catalog Service (3006)...${NC}"
PORT=3006 pnpm --filter catalog-service dev > logs/catalog-service.log 2>&1 &
CATALOG_PID=$!
echo -e "${GREEN}   PID: $CATALOG_PID${NC}"

echo -e "${GREEN}🚀 Starting Booking Service (3007)...${NC}"
PORT=3007 pnpm --filter booking-service dev > logs/booking-service.log 2>&1 &
BOOKING_PID=$!
echo -e "${GREEN}   PID: $BOOKING_PID${NC}"

echo -e "${GREEN}🚀 Starting AI Assistant (3008)...${NC}"
PORT=3008 pnpm --filter ai-assistant dev > logs/ai-assistant.log 2>&1 &
AI_PID=$!
echo -e "${GREEN}   PID: $AI_PID${NC}"

echo -e "${GREEN}🚀 Starting Backend Legacy/Core (5000)...${NC}"
PORT=5000 pnpm --filter backend dev > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}   PID: $BACKEND_PID${NC}"

# Wait for Backend to initialize before starting Frontends
wait_for_service 5000 "Core Backend"

# --- Frontends ---

echo -e "${GREEN}🚀 Starting Admin App (4000)...${NC}"
PORT=4000 pnpm --filter admin dev > logs/admin.log 2>&1 &
ADMIN_PID=$!
echo -e "${GREEN}   PID: $ADMIN_PID${NC}"

echo -e "${GREEN}🚀 Starting Web App (5002)...${NC}"
PORT=5002 pnpm --filter web dev > logs/web.log 2>&1 &
WEB_PID=$!
echo -e "${GREEN}   PID: $WEB_PID${NC}"


echo -e "${GREEN}🚀 Starting Provider App (5003)...${NC}"
# Port updated in package.json to 5003
pnpm --filter provider dev > logs/provider.log 2>&1 &
PROVIDER_PID=$!
echo -e "${GREEN}   PID: $PROVIDER_PID${NC}"

echo -e "${GREEN}🚀 Starting Delivery App (5004)...${NC}"
# Port updated in package.json to 5004
pnpm --filter delivery dev > logs/delivery.log 2>&1 &
DELIVERY_APP_PID=$!
echo -e "${GREEN}   PID: $DELIVERY_APP_PID${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All Services Started Successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
# Get Local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo -e "${BLUE}📍 Local Application URLs:${NC}"
echo -e "   🔹 Admin Dashboard:    ${GREEN}http://localhost:4000${NC}"
echo -e "   🔹 Main Website:       ${GREEN}http://localhost:5002${NC}"
echo -e "   🔹 Provider Portal:    ${GREEN}http://localhost:5003${NC}"
echo -e "   🔹 Delivery App:       ${GREEN}http://localhost:5004${NC}"

echo ""
echo -e "${BLUE}🌐 Network URLs (Access from other devices):${NC}"
if [ -n "$LOCAL_IP" ]; then
    echo -e "   🔹 Admin Dashboard:    ${GREEN}http://$LOCAL_IP:4000${NC}"
    echo -e "   🔹 Main Website:       ${GREEN}http://$LOCAL_IP:5002${NC}"
    echo -e "   🔹 Provider Portal:    ${GREEN}http://$LOCAL_IP:5003${NC}"
    echo -e "   🔹 Delivery App:       ${GREEN}http://$LOCAL_IP:5004${NC}"
else
    echo -e "   ${YELLOW}⚠️  Could not detect local IP${NC}"
fi
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   🔹 API Gateway:        ${GRAY}http://localhost:3001${NC}"
echo -e "   🔹 Auth Service:       ${GRAY}http://localhost:3002${NC}"
echo -e "   🔹 User Service:       ${GRAY}http://localhost:3003${NC}"
echo -e "   🔹 Delivery API:       ${GRAY}http://localhost:3004${NC}"
echo -e "   🔹 Finance Service:    ${GRAY}http://localhost:3005${NC}"
echo -e "   🔹 Catalog Service:    ${GRAY}http://localhost:3006${NC}"
echo -e "   🔹 Booking Service:    ${GRAY}http://localhost:3007${NC}"
echo -e "   🔹 AI Assistant:       ${GRAY}http://localhost:3008${NC}"
echo -e "   🔹 Core Backend:       ${GRAY}http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}📁 Logs:${NC}"
echo -e "   View all logs in ${YELLOW}logs/${NC} directory."
echo -e "   Example: ${BLUE}tail -f logs/admin.log${NC}"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services.${NC}"

# Save PIDs to file for easy cleanup
echo "$GATEWAY_PID $AUTH_PID $USER_PID $DELIVERY_PID $FINANCE_PID $CATALOG_PID $BOOKING_PID $AI_PID $BACKEND_PID $ADMIN_PID $WEB_PID $PROVIDER_PID $DELIVERY_APP_PID" > .dev-pids

# Keep script running
trap 'echo -e "\n${YELLOW}Stopping all services...${NC}"; kill $(cat .dev-pids) 2>/dev/null; exit 0' INT
sleep infinity

