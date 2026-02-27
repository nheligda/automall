@echo off
REM AUTOMALL - Import / Sync Database
REM Uses backup dump if available, otherwise base schema.

setlocal

REM Detect MySQL port (default 3306). Change here if your XAMPP MySQL
REM runs on a different port; scripts and PHP will keep working.
set "MYSQL_PORT=3306"

set "DB_NAME=automall_db"
set "PROJECT_DIR=C:\xampp\htdocs\automall proj"
set "SCHEMA_SQL=%PROJECT_DIR%\database\automall_schema.sql"
set "BACKUP_SQL=%PROJECT_DIR%\database\automall_backup.sql"

echo.
echo Creating database (if missing)...
mysql -u root -P %MYSQL_PORT% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if exist "%BACKUP_SQL%" (
	echo.
	echo Importing latest backup: %BACKUP_SQL%
	mysql -u root -P %MYSQL_PORT% %DB_NAME% < "%BACKUP_SQL%"
) else (
	echo.
	echo No backup found. Importing base schema: %SCHEMA_SQL%
	mysql -u root -P %MYSQL_PORT% < "%SCHEMA_SQL%"
)

echo.
echo Verifying tables in %DB_NAME% ...
mysql -u root -P %MYSQL_PORT% %DB_NAME% -e "SHOW TABLES;"

echo.
echo ✅ Database import / sync complete!
echo.
pause
endlocal
