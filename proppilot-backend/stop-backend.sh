#!/bin/bash

# PropPilot Backend Stop Script
# This script stops the backend and database services

echo "🛑 Stopping PropPilot Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop Backend (Spring Boot)
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    echo -e "${YELLOW}🔄 Stopping Backend (PID: $BACKEND_PID)...${NC}"
    if kill $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Backend stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop backend or backend was not running${NC}"
    fi
    rm -f backend.pid
else
    echo -e "${YELLOW}⚠️  No backend PID file found${NC}"
fi

# Stop PostgreSQL database
echo -e "${YELLOW}🔄 Stopping PostgreSQL database...${NC}"
docker-compose down
echo -e "${GREEN}✅ PostgreSQL stopped${NC}"

echo ""
echo -e "${GREEN}🎉 PropPilot Backend stopped!${NC}"
