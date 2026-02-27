@echo off
REM ============================================
REM AUTOMALL - Quick Start Script for Windows
REM ============================================
REM This script starts the AUTOMALL development environment

echo.
echo ╔════════════════════════════════════════════╗
echo ║        🚗 AUTOMALL Quick Start             ║
echo ║    Web-Based Car Sales System (PHP+React)  ║
echo ╚════════════════════════════════════════════╝
echo.

REM Step 1: Check if XAMPP is installed
echo [1/4] Checking XAMPP installation...
if exist "C:\xampp\htdocs\" (
    echo ✓ XAMPP found at C:\xampp
) else (
    echo ✗ XAMPP not found. Please install XAMPP first.
    echo Download: https://www.apachefriends.org/
    pause
    exit /b 1
)

REM Step 2: Start XAMPP services
echo.
echo [2/4] Starting XAMPP services...
echo Please start Apache and MySQL from XAMPP Control Panel:
echo   1. Open XAMPP Control Panel (C:\xampp\xampp-control.exe)
echo   2. Click "Start" next to Apache
echo   3. Click "Start" next to MySQL
echo.
pause

REM Step 3: Verify backend
echo.
echo [3/4] Verifying backend...
echo Testing: http://localhost/automall proj/backend/health_check.php
timeout /t 2 /nobreak
start http://localhost/automall proj/backend/health_check.php

REM Step 4: Start frontend (Vite dev server for live reload)
echo.
echo [4/4] Starting React frontend dev server...
cd /d "C:\xampp\htdocs\automall proj"

echo.
echo This will run the Vite dev server (npm run dev)
echo and automatically reload the browser whenever you
echo change the React/TypeScript files.
echo.
pause

call DEV.bat

echo.
echo ✓ AUTOMALL dev environment is running!
echo.
echo Open in browser while DEV.bat is running:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost/automall proj/backend/health_check.php
echo   Database: http://localhost/phpmyadmin
echo.
pause
