@echo off
chcp 65001 >nul
title USTAD MONITOR - GIT SURUM KAYDI
cd /d "%~dp0"
echo ============================================================
echo   USTAD DUNYA MONITORU - SURUM KAYDI (git commit)
echo ============================================================
echo.
echo  Bu betik projedeki TUM degisiklikleri kaydeder.
echo  Kayit YALNIZCA bu bilgisayarda tutulur, hicbir yere gonderilmez.
echo.

where git >nul 2>nul
if not %errorlevel%==0 (
  echo  [!] Git kurulu degil. https://git-scm.com/download/win adresinden kurup tekrar dene.
  pause
  exit /b
)

if not exist ".git" (
  echo  Ilk kez: depo olusturuluyor...
  git init -q
  git config user.name "USTAD KENAN KUZUCU"
  git config user.email "ustad@localhost"
  echo  .gitignore yaziliyor...
  > .gitignore echo veri/
  >> .gitignore echo *.log
  >> .gitignore echo __pycache__/
)

git add -A
set TARIH=%DATE% %TIME%
git commit -q -m "Surum kaydi: %TARIH%"
if %errorlevel%==0 (echo  [OK] Kayit alindi: %TARIH%) else (echo  [i] Degisiklik yok veya kayit alinamadi.)

echo  Son kayitlar:
git log --oneline -5

if not exist "veri" mkdir veri
> veri\git-durum.js echo /* USTAD MONITOR - git durum dosyasi */
>> veri\git-durum.js echo window.USTAD_GIT_SON="%TARIH%";
for /f "delims=" %%i in ('git log -1 --pretty^=%%h') do >> veri\git-durum.js echo window.USTAD_GIT_KOD="%%i";

echo.
echo  Panelde AYARLAR sekmesinde son kayit tarihi gorunur.
echo  Bir sey bozulursa: USTAD-GIT-GERI-DON.bat
pause
