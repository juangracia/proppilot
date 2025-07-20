#!/bin/bash

# PropPilot Full Stack Stop Script
# This script stops the database, backend, and frontend services

echo "🛑 Stopping PropPilot Full Stack..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop Frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    echo -e "${BLUE}🎨 Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
    if kill $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend process not found or already stopped${NC}"
    fi
    rm -f frontend.pid
else
    echo -e "${YELLOW}⚠️  No frontend PID file found${NC}"
fi

# Stop Backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    echo -e "${BLUE}⚙️  Stopping Backend (PID: $BACKEND_PID)...${NC}"
    if kill $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Backend stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend process not found or already stopped${NC}"
    fi
    rm -f backend.pid
else
    echo -e "${YELLOW}⚠️  No backend PID file found${NC}"
fi

# Stop any remaining Java processes (Spring Boot)
echo -e "${BLUE}🔍 Checking for remaining Java processes...${NC}"
JAVA_PIDS=$(pgrep -f "spring-boot:run" || true)
if [ ! -z "$JAVA_PIDS" ]; then
    echo -e "${YELLOW}🔄 Stopping remaining Spring Boot processes...${NC}"
    echo $JAVA_PIDS | xargs kill 2>/dev/null || true
    echo -e "${GREEN}✅ Spring Boot processes stopped${NC}"
fi

# Stop any remaining Node processes (Vite)
echo -e "${BLUE}🔍 Checking for remaining Node processes...${NC}"
NODE_PIDS=$(pgrep -f "vite" || true)
if [ ! -z "$NODE_PIDS" ]; then
    echo -e "${YELLOW}🔄 Stopping remaining Vite processes...${NC}"
    echo $NODE_PIDS | xargs kill 2>/dev/null || true
    echo -e "${GREEN}✅ Vite processes stopped${NC}"
fi

# Stop PostgreSQL database
echo -e "${BLUE}📊 Stopping PostgreSQL database...${NC}"
docker-compose down
echo -e "${GREEN}✅ PostgreSQL stopped${NC}"

# Clean up log files (optional)
echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
rm -f backend.log frontend.log

echo ""
echo -e "${GREEN}✅ All PropPilot services have been stopped!${NC}"
echo ""
