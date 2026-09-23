@echo off
title OceanSight 3D - Live Ocean Visualizer (SIH26067)
echo ===================================================
echo   OceanSight 3D - Starting Local Web Server...
echo   Open in browser: http://localhost:8080
echo ===================================================
cd /d "%~dp0"
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080"
uv run python -m http.server 8080
if %ERRORLEVEL% NEQ 0 (
    python -m http.server 8080
)
pause
