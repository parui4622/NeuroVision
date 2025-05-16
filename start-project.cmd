@echo off
REM Ensure npm and node are available
where npm >nul 2>nul || (
    echo npm is not installed or not in PATH. Please install Node.js and npm first.
    pause
    exit /b 1
)

REM Ensure pip is available for Python dependencies
where pip >nul 2>nul || (
    echo pip is not installed or not in PATH. Please install Python and pip first.
    pause
    exit /b 1
)

echo Starting Alzheimer's Detection Project...
REM Store the original directory
set "ORIGINAL_DIR=%CD%"

echo.
echo Installing Backend Node.js Dependencies...
cd major-project-backend
call npm install
if errorlevel 1 (
    echo Error installing backend dependencies
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

REM Install Python dependencies
if exist "python\requirements.txt" (
    echo Installing Python dependencies...
    pushd python
    call pip install -r requirements.txt
    if errorlevel 1 (
        echo Error installing Python dependencies
        popd
        cd "%ORIGINAL_DIR%"
        pause
        exit /b 1
    )
    popd
)

start cmd /k "npm start"

cd "%ORIGINAL_DIR%"
echo.
echo Installing Frontend Node.js Dependencies...
cd major-project-frontend
call npm install
if errorlevel 1 (
    echo Error installing frontend dependencies
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

start cmd /k "npm run dev"

cd "%ORIGINAL_DIR%"
echo.
echo Project is starting up! Please wait...
echo Backend will be available at: http://localhost:5000 (or next available port)
echo Frontend will be available at: http://localhost:5173

echo.
echo Press any key to close this window...
pause > nul
