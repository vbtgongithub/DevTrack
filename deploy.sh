#!/bin/bash
# DevTrack Production Deployment Script
# Usage: ./deploy.sh [--no-build]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}==> DevTrack Deployment${NC}"

# Parse args
SKIP_BUILD=false
if [[ "$1" == "--no-build" ]]; then
    SKIP_BUILD=true
fi

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}WARNING: backend/.env not found.${NC}"
    echo "Copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

# Build containers
if [ "$SKIP_BUILD" = false ]; then
    echo -e "\n${GREEN}==> Building containers...${NC}"
    docker compose build --parallel
fi

# Start services
echo -e "\n${GREEN}==> Starting services...${NC}"
docker compose up -d

# Wait for backend health
echo -e "\n${GREEN}==> Checking health...${NC}"
BACKEND_HEALTHY=false
for i in {1..30}; do
    if docker exec devtrack-backend wget -qO- http://localhost:3001/health > /dev/null 2>&1; then
        BACKEND_HEALTHY=true
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 2
done

if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "\n${GREEN}==> Deployment successful!${NC}"
    echo -e "\nServices:"
    docker compose ps
else
    echo -e "\n${YELLOW}Backend health check failed. Check logs:${NC}"
    docker compose logs backend
    exit 1
fi