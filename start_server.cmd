@echo off
title Al-Najjar Showroom Web Server
echo ===========================================================
echo   Al-Najjar Showroom Web Server Startup Tool (Windows)      
echo ===========================================================
echo.
echo 1. Installing required node packages... Please wait.
call npm install
echo.
echo 2. Launching Backend Web Server in Development Mode...
echo.
call npm run dev
pause