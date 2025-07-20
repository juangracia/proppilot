#!/bin/bash

# PropPilot Full Stack Startup Script
# This script starts the database, backend, and frontend services

set -e  # Exit on any error

echo "🚀 Starting PropPilot Full Stack..."

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

# Check and start PostgreSQL database
echo -e "${BLUE}📊 Checking PostgreSQL database...${NC}"
if check_port 5432; then
    echo -e "${GREEN}✅ PostgreSQL is already running on port 5432${NC}"
else
    echo -e "${YELLOW}🔄 Starting PostgreSQL database...${NC}"
    docker-compose up -d
    sleep 5
    if check_port 5432; then
        echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi

# Check and start Backend (Spring Boot)
echo -e "${BLUE}⚙️  Checking Backend (Spring Boot)...${NC}"
if check_port 8080; then
    echo -e "${GREEN}✅ Backend is already running on port 8080${NC}"
else
    echo -e "${YELLOW}🔄 Starting Backend (Spring Boot)...${NC}"
    cd backend
    # Start backend in background
    nohup mvn spring-boot:run > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    
    # Wait for backend to be ready
    if wait_for_service "http://localhost:8080/actuator/health" "Backend"; then
        echo -e "${GREEN}✅ Backend started successfully (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend may still be starting up. Check backend.log for details.${NC}"
    fi
fi

# Check and start Frontend (React/Vite)
echo -e "${BLUE}🎨 Checking Frontend (React)...${NC}"
if check_port 5173; then
    echo -e "${GREEN}✅ Frontend is already running on port 5173${NC}"
else
    echo -e "${YELLOW}🔄 Starting Frontend (React)...${NC}"
    cd frontend
    # Start frontend in background
    nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    
    # Wait for frontend to be ready
    if wait_for_service "http://localhost:5173" "Frontend"; then
        echo -e "${GREEN}✅ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend may still be starting up. Check frontend.log for details.${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 PropPilot Full Stack is ready!${NC}"
echo ""
echo "📱 Services:"
echo "   • Database:  http://localhost:5432 (PostgreSQL)"
echo "   • Backend:   http://localhost:8080 (Spring Boot API)"
echo "   • Frontend:  http://localhost:5173 (React App)"
echo ""
echo "📋 Useful commands:"
echo "   • View backend logs:  tail -f backend.log"
echo "   • View frontend logs: tail -f frontend.log"
echo "   • Stop all services:  ./stop-all.sh"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
