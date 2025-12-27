@echo off
echo Project Voice - P2P Communication App
echo ======================================
echo.
echo This will start the Project Voice application.
echo Make sure you have Node.js and npm installed on your system.
echo.
echo Starting application...
echo.

REM Change to the application directory
cd /d "%~dp0"

REM Install dependencies if not already installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --no-audit --no-fund
    if errorlevel 1 (
        echo Failed to install dependencies.
        echo Please make sure you have Node.js and npm installed.
        pause
        exit /b 1
    )
)

REM Start the application
npm start

echo.
echo Application closed.
pause