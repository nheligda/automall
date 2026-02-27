@echo off
REM AUTOMALL - Continuous Frontend Auto-Build for Apache
REM Keeps backend/public in sync whenever you edit the React UI.

cd /d "C:\xampp\htdocs\automall proj"

REM Install deps on first run only
if not exist "node_modules" (
  echo Installing npm dependencies (first run)...
  call npm install
  if %errorlevel% neq 0 (
    echo NPM install failed!
    pause
    exit /b 1
  )
)

echo.
echo =========================================
echo  Starting AUTO BUILD watcher
echo  - Watches src/ for changes
echo  - Rebuilds into backend/public on save
echo  - Use Apache at http://localhost/automall%%20proj/
echo =========================================
echo.
echo Press Ctrl+C to stop this watcher.
echo.

call npm run build:watch

pause
