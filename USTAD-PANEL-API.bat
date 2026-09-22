@echo off
chcp 65001 >nul
title USTAD MONITOR - PANEL API + YEREL SUNUCU (port 8890)
cd /d "%~dp0"
echo ============================================================
echo   USTAD DUNYA MONITORU - PANEL API + YEREL SUNUCU
echo ============================================================
echo.
echo   Panel  : http://localhost:8890/index.html
echo   Veri   : http://localhost:8890/durum.json
echo.
echo   Bu modda: sesli komut + askeri ucaklar + Hue calisir.
echo   Diger uygulamalarin (PIYASA, GAZETE, TV) durum.json'u cekebilir.
echo.
start "" http://localhost:8890/index.html
where python >nul 2>nul
if %errorlevel%==0 (python panel-api.py) else (py panel-api.py)
