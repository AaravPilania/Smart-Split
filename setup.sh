#!/usr/bin/env bash

# Splitwise Frontend - Project Setup & Health Check Script
# This script automatically sets up and verifies the project

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Splitwise Frontend - Health Check & Setup"
echo "==========================================="
echo ""

# Check Node.js
echo -n "✓ Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}OK${NC} (${NODE_VERSION})"
else
    echo -e "${RED}NOT FOUND${NC}"
    echo "  Install Node.js from https://nodejs.org"
    exit 1
fi

# Check npm
echo -n "✓ Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}OK${NC} (${NPM_VERSION})"
else
    echo -e "${RED}NOT FOUND${NC}"
    exit 1
fi

# Check MySQL connection
echo -n "✓ Checking MySQL... "
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}NOT FOUND${NC} (optional, must be running separately)"
fi

echo ""
echo "📦 Backend Setup"
echo "================"

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo -n "Installing backend dependencies... "
    cd backend
    npm install > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Done${NC}"
    else
        echo -e "${RED}Failed${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "✓ Backend dependencies already installed"
fi

echo ""
echo "📦 Frontend Setup"
echo "================"

# Frontend dependencies
if [ ! -d "node_modules" ]; then
    echo -n "Installing frontend dependencies... "
    npm install > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Done${NC}"
    else
        echo -e "${RED}Failed${NC}"
        exit 1
    fi
else
    echo -e "✓ Frontend dependencies already installed"
fi

echo ""
echo "🏗️  Frontend Build"
echo "=================="

# Check if dist folder exists and is recent
if [ -d "dist" ]; then
    echo -e "✓ Build output exists (${GREEN}dist/${NC})"
else
    echo -n "Building frontend... "
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Done${NC}"
    else
        echo -e "${RED}Failed${NC}"
        echo "  Run: npm run build"
        exit 1
    fi
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the project:"
echo ""
echo "1. Start MySQL server (if not running)"
echo ""
echo "2. Start backend (in terminal 1):"
echo "   cd backend && npm start"
echo ""
echo "3. Start frontend (in terminal 2):"
echo "   npm run dev"
echo ""
echo "4. Open browser:"
echo "   http://localhost:5173"
echo ""
echo -e "Backend API: ${GREEN}http://localhost:5000/api${NC}"
echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
echo ""
