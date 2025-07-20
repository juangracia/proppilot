#!/bin/bash

# PropPilot Full Stack Status Check Script
# This script checks the status of all services

echo "📊 PropPilot Full Stack Status"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to check service health
check_service_health() {
    local url=$1
    if curl -s "$url" >/dev/null 2>&1; then
        return 0  # Service is healthy
    else
        return 1  # Service is not responding
    fi
}

echo ""

# Check PostgreSQL Database
echo -e "${BLUE}📊 PostgreSQL Database (Port 5432):${NC}"
if check_port 5432; then
    echo -e "   Status: ${GREEN}✅ RUNNING${NC}"
    CONTAINER_STATUS=$(docker ps --filter "name=proppilot-postgres" --format "{{.Status}}" 2>/dev/null || echo "Not found")
    echo "   Container: $CONTAINER_STATUS"
else
    echo -e "   Status: ${RED}❌ NOT RUNNING${NC}"
fi

echo ""

# Check Backend
echo -e "${BLUE}⚙️  Backend API (Port 8080):${NC}"
if check_port 8080; then
    echo -e "   Status: ${GREEN}✅ RUNNING${NC}"
    if check_service_health "http://localhost:8080/actuator/health"; then
        echo -e "   Health: ${GREEN}✅ HEALTHY${NC}"
    else
        echo -e "   Health: ${YELLOW}⚠️  STARTING UP${NC}"
    fi
    
    # Check if PID file exists
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo "   PID: $BACKEND_PID"
        else
            echo -e "   PID: ${YELLOW}⚠️  Stale PID file${NC}"
        fi
    fi
else
    echo -e "   Status: ${RED}❌ NOT RUNNING${NC}"
fi

echo ""

# Check Frontend
echo -e "${BLUE}🎨 Frontend App (Port 5173):${NC}"
if check_port 5173; then
    echo -e "   Status: ${GREEN}✅ RUNNING${NC}"
    if check_service_health "http://localhost:5173"; then
        echo -e "   Health: ${GREEN}✅ HEALTHY${NC}"
    else
        echo -e "   Health: ${YELLOW}⚠️  STARTING UP${NC}"
    fi
    
    # Check if PID file exists
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo "   PID: $FRONTEND_PID"
        else
            echo -e "   PID: ${YELLOW}⚠️  Stale PID file${NC}"
        fi
    fi
else
    echo -e "   Status: ${RED}❌ NOT RUNNING${NC}"
fi

echo ""
echo "🔗 Service URLs:"
echo "   • Database:  postgresql://proppilot:proppilot123@localhost:5432/proppilot"
echo "   • Backend:   http://localhost:8080"
echo "   • Frontend:  http://localhost:5173"
echo ""

# Check for log files
if [ -f backend.log ] || [ -f frontend.log ]; then
    echo "📋 Available logs:"
    if [ -f backend.log ]; then
        echo "   • Backend:  tail -f backend.log"
    fi
    if [ -f frontend.log ]; then
        echo "   • Frontend: tail -f frontend.log"
    fi
    echo ""
fi

echo "🛠️  Management commands:"
echo "   • Start all:  ./start-all.sh"
echo "   • Stop all:   ./stop-all.sh"
echo "   • Status:     ./status.sh"
echo ""
