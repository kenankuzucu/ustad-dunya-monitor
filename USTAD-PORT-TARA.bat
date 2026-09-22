@echo off
chcp 65001 >nul
title USTAD MONITOR - YEREL PORT TARAMA (yalnizca kendi makinen)
cd /d "%~dp0"
echo ============================================================
echo   USTAD DUNYA MONITORU - YEREL PORT TARAMASI
echo ============================================================
echo.
echo  Bu islem SADECE bu bilgisayarin dinlenen portlarini listeler
echo  (netstat) ve panele yazar. Internet'e hicbir sey gonderilmez.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0port-tara.ps1"
pause
