@echo off
echo Starting Alzheimer's Detection Project...

REM Store the original directory
set "ORIGINAL_DIR=%CD%"

echo.
echo Starting Backend Server...

REM Kill any process using port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do (
    taskkill /F /PID %%a 2>nul
)

cd major-project-backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing backend dependencies
        cd "%ORIGINAL_DIR%"
        pause
        exit /b 1
    )
)
start cmd /k "npm start"

echo.
echo Starting Frontend...
cd ../major-project-frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing frontend dependencies
        cd "%ORIGINAL_DIR%"
        pause
        exit /b 1
    )
)
start cmd /k "npm run dev"

echo.
echo Project is starting up! Please wait...
echo Backend will be available at: http://localhost:5000 (or next available port)
echo Frontend will be available at: http://localhost:5173

REM Return to original directory
cd "%ORIGINAL_DIR%"

echo.
echo Press any key to close this window...
pause > nul
