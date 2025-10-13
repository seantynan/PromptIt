@echo off
title Prettifier App - Local Launcher

echo ----------------------------------------
echo   Starting Prettifier (local version)
echo ----------------------------------------

:: Check Node.js installation
where npx >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Please install it from https://nodejs.org/
    pause
    exit /b
)

:: Start HTTP server on port 8080
echo Launching local server at http://localhost:8080 ...
npx http-server -p 8080 >nul 2>&1 &

:: Wait for server to initialize
timeout /t 2 >nul

:: Open the browser automatically
start http://localhost:8080

echo.
echo App is now running. Press Ctrl+C in this window to stop the server.
pause
