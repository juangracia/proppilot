#!/bin/bash

# PropPilot Frontend Startup Script
# This script starts the React frontend application

set -e  # Exit on any error

echo "🚀 Starting PropPilot Frontend..."

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

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check and start Frontend (React/Vite)
echo -e "${BLUE}🎨 Checking Frontend (React)...${NC}"
if check_port 5173; then
    echo -e "${GREEN}✅ Frontend is already running on port 5173${NC}"
else
    echo -e "${YELLOW}🔄 Starting Frontend (React)...${NC}"
    # Start frontend in background
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    # Wait for frontend to be ready
    if wait_for_service "http://localhost:5173" "Frontend"; then
        echo -e "${GREEN}✅ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend may still be starting up. Check frontend.log for details.${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 PropPilot Frontend is ready!${NC}"
echo ""
echo "📱 Services:"
echo "   • Frontend:  http://localhost:5173 (React App)"
echo ""
echo "📋 Useful commands:"
echo "   • View frontend logs: tail -f frontend.log"
echo "   • Stop frontend:      ./stop-frontend.sh"
echo ""
echo "⚠️  Note: Make sure the backend is running at http://localhost:8080"
