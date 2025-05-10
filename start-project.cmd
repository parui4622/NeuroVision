@echo off
echo Starting Alzheimer's Detection Project...

echo.
echo Starting Backend Server...
cd major-project-backend
start cmd /k "npm install && npm start"

echo.
echo Starting Frontend...
cd ../major-project-frontend
start cmd /k "npm install && npm run dev"

echo.
echo Project is starting up! Please wait...
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:5173
