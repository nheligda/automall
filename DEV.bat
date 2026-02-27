@echo off
cd /d "C:\xampp\htdocs\automall proj"

:: Install deps only if node_modules is missing
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
echo Starting Vite dev server on http://localhost:5173 ...
echo (Leave this window open while you test the app.)
echo.
call npm run dev

pause
