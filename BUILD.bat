@echo off
cd /d "C:\xampp\htdocs\automall proj"
echo Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo NPM install failed!
    pause
    exit /b 1
)
echo.
echo Cleaning previous build output...
if exist "backend\public\assets" rmdir /s /q "backend\public\assets"
if exist "backend\public\index.html" del /f /q "backend\public\index.html"
echo.
echo Building React frontend for Apache...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo Your app is ready at:
echo   http://localhost/automall%%20proj/
echo ========================================
pause
