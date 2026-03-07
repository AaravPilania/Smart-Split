@echo off
REM Splitwise Frontend - Project Setup & Health Check Script for Windows
REM This script automatically sets up and verifies the project

color 0A
echo.
echo ========================================
echo  Splitwise Frontend - Health Check
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [OK] Node.js %NODE_VERSION%
)

REM Check npm
echo Checking npm...
npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [OK] npm %NPM_VERSION%
)

echo.
echo ========================================
echo  Backend Setup
echo ========================================

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    if errorlevel 1 (
        echo [ERROR] Backend installation failed
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [OK] Backend dependencies already installed
)

echo.
echo ========================================
echo  Frontend Setup
echo ========================================

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Frontend installation failed
        pause
        exit /b 1
    )
) else (
    echo [OK] Frontend dependencies already installed
)

echo.
echo ========================================
echo  Frontend Build
echo ========================================

if exist "dist" (
    echo [OK] Build output exists (dist\)
) else (
    echo Building frontend...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo To start the project:
echo.
echo 1. Start MySQL server (if not running)
echo.
echo 2. Start backend (in terminal 1):
echo    cd backend ^&^& npm start
echo.
echo 3. Start frontend (in terminal 2):
echo    npm run dev
echo.
echo 4. Open browser:
echo    http://localhost:5173
echo.
echo Backend API: http://localhost:5000/api
echo Frontend:    http://localhost:5173
echo.
pause
