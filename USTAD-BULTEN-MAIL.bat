@echo off
chcp 65001 >nul
title USTAD MONITOR - GUNLUK BULTEN E-POSTA
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  python mail-gonder.py
) else (
  py mail-gonder.py
)
