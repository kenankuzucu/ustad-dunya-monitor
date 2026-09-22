@echo off
chcp 65001 >nul
title USTAD MONITOR - GIRIS ANIMASYONU (tekrar goster)
cd /d "%~dp0"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Chrome bulunamadi.
  pause
  exit /b
)
echo Giriş animasyonu (NÖBETTEYİZ · bayraklar · beyaz şapkalı hacker) açılıyor...
start "" "%CHROME%" --disable-web-security --autoplay-policy=no-user-gesture-required --user-data-dir="%LOCALAPPDATA%\UstadMonitorProfil" --start-maximized --app="file:///C:/Users/kenan/OneDrive/Desktop/USTAD-DUNYA-MONITOR/index.html#giris"
