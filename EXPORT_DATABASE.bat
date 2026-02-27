@echo off
REM AUTOMALL - Export / Backup Database

setlocal

set "MYSQL_PORT=3306"
set "DB_NAME=automall_db"
set "PROJECT_DIR=C:\xampp\htdocs\automall proj"
set "BACKUP_SQL=%PROJECT_DIR%\database\automall_backup.sql"

echo.
echo Backing up %DB_NAME% from MySQL (port %MYSQL_PORT%) ...

mysqldump -u root -P %MYSQL_PORT% --databases %DB_NAME% --add-drop-database --routines --events > "%BACKUP_SQL%"

if %errorlevel% neq 0 (
  echo ✗ Backup failed. Please ensure MySQL is running and the database exists.
) else (
  echo.
  echo ✅ Backup complete: %BACKUP_SQL%
)

echo.
pause
endlocal
