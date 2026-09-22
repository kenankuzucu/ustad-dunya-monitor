@echo off
chcp 65001 >nul
title USTAD MONITOR - SON KAYDA GERI DON
cd /d "%~dp0"
echo ============================================================
echo   USTAD DUNYA MONITORU - SON KAYDA GERI DONUS
echo ============================================================
echo.
echo  DIKKAT: Bu islem son kayittan SONRA yapilan tum degisiklikleri geri alir.
echo  (Kaydedilmemis degisiklikler silinir, dosyalar son commit haline doner.)
echo.
set /p ONAY="Devam etmek icin E yaz: "
if /i not "%ONAY%"=="E" (echo  Iptal edildi. & pause & exit /b)

where git >nul 2>nul
if not %errorlevel%==0 (echo  [!] Git kurulu degil. & pause & exit /b)

echo  Son kayitlar:
git log --oneline -8
echo.
echo  GERI DONULUYOR...
git reset --hard HEAD
if %errorlevel%==0 (
  echo  [OK] Son kayda donuldu. Simdi paneli acip kontrol et.
) else (
  echo  [!] Geri donus basarisiz.
)
pause
