#!/bin/bash

# PropPilot Frontend Stop Script
# This script stops the React frontend application

echo "🛑 Stopping PropPilot Frontend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop Frontend (React/Vite)
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    echo -e "${YELLOW}🔄 Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
    if kill $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop frontend or frontend was not running${NC}"
    fi
    rm -f frontend.pid
else
    echo -e "${YELLOW}⚠️  No frontend PID file found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 PropPilot Frontend stopped!${NC}"
