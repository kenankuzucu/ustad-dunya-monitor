@echo off
chcp 65001 >nul
title USTAD DUNYA MONITORU - YEREL SUNUCU (Telefon + Sesli Komut Modu)
cd /d "%~dp0"
echo ============================================================
echo   USTAD KENAN KUZUCU - USTAD DUNYA MONITORU
echo   YEREL SUNUCU MODU  (http://localhost:8878)
echo ============================================================
echo.
echo  Bu modda:
echo    * Sesli komut (mikrofon) CALISIR
echo    * Askeri ucaklar gorunur (CORS serbest)
echo    * Telefondan ayni ag uzerinden baglanabilirsin (QR kod)
echo    * Anahtarlar yine yalnizca bu bilgisayarda kalir
echo.
echo  Kapatmak icin bu pencereyi kapatin veya Ctrl+C.
echo.

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

where python >nul 2>nul
if %errorlevel%==0 (
  if exist "%CHROME%" ( start "" "%CHROME%" --autoplay-policy=no-user-gesture-required --app="http://localhost:8878/index.html" ) else ( start "" http://localhost:8878/index.html )
  python -m http.server 8878
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    if exist "%CHROME%" ( start "" "%CHROME%" --autoplay-policy=no-user-gesture-required --app="http://localhost:8878/index.html" ) else ( start "" http://localhost:8878/index.html )
    py -m http.server 8878
  ) else (
    echo  [!] Python bulunamadi. Panel dosya modunda aciliyor...
    if exist "%CHROME%" ( start "" "%CHROME%" --autoplay-policy=no-user-gesture-required --disable-web-security --user-data-dir="%LOCALAPPDATA%\UstadMonitorProfil" --app="file:///C:/Users/kenan/OneDrive/Desktop/USTAD-DUNYA-MONITOR/index.html" ) else ( start "" "index.html" )
  )
)
