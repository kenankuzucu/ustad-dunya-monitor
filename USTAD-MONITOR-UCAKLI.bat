@echo off
chcp 65001 >nul
title USTAD DUNYA MONITORU (Ucakli)
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Chrome bulunamadi. Lutfen Chrome kurulu oldugundan emin ol.
  pause
  exit /b
)
echo USTAD Dunya Monitoru - canli ucaklarla aciliyor...
start "" "%CHROME%" --disable-web-security --autoplay-policy=no-user-gesture-required --user-data-dir="%LOCALAPPDATA%\UstadMonitorProfil" --app="file:///C:/Users/kenan/OneDrive/Desktop/USTAD-DUNYA-MONITOR/index.html"
