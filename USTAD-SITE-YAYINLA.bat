@echo off
chcp 65001 >nul
title USTAD MONITOR - SITEYE YAYIN PAKETI
cd /d "%~dp0"
echo ============================================================
echo   USTAD DUNYA MONITORU - SITEYE YAYIN PAKETI
echo ============================================================
echo.
echo   Bu betik, panelin SADE (halka acik) bir kopyasini "site" klasorune
echo   hazirlar. Sonra cenuta cPanel > Dosya Yoneticisi ile
echo   ustadkenankuzucu.com.tr altindaki bir klasore yukleyebilirsin.
echo.
echo   Panelde AYARLAR, GUVENLIK ve ZEKA sekmeleri bu kopyada GIZLENIR
echo   (kisisel veriler ve notlar disari cikmaz).
echo.

if exist "site" (
  echo  [!] "site" klasoru zaten var. Temizlenip yeniden kurulacak.
  set /p ONAY="Devam etmek icin E yaz: "
  if /i not "%ONAY%"=="E" (echo Iptal & pause & exit /b)
  rmdir /s /q site
)
mkdir site
mkdir site\foto

echo  Dosyalar kopyalaniyor...
copy /y index.html site\ >nul
for %%f in (kablolar.js statik-veri.js ek-veri.js giris.js katmanlar.js katman3.js katman2.js katman4.js siber.js panel-zeka.js analiz.js komuta.js kisisel.js kaynak2.js zeka2.js guvenlik.js disari.js) do (
  if exist "%%f" copy /y "%%f" site\ >nul
)
if exist foto\ustad-kenan.jpg copy /y foto\ustad-kenan.jpg site\foto\ >nul
if exist foto\favicon.png copy /y foto\favicon.png site\foto\ >nul
if exist foto\favicon.ico copy /y foto\favicon.ico site\foto\ >nul
if exist foto\rozet.png copy /y foto\rozet.png site\foto\ >nul

echo  Halka acik surumde kisisel sekmeler kapatiliyor (index.html duzenleniyor)...
powershell -NoProfile -Command "$p='site\index.html'; $t=Get-Content $p -Raw -Encoding UTF8; $t=$t -replace '<a data-git=\"ayarlar\"[^<]*</a>','' -replace '<a data-git=\"guvenlik\"[^<]*</a>','' -replace '<a data-git=\"zeka\"[^<]*</a>',''; Set-Content $p $t -Encoding UTF8"

echo  README yaziliyor...
> site\YUKLEME-ADIMLARI.txt echo USTAD DUNYA MONITORU - SITEYE YUKLEME
>> site\YUKLEME-ADIMLARI.txt echo =====================================
>> site\YUKLEME-ADIMLARI.txt echo 1) cenuta cPanel > Dosya Yoneticisi
>> site\YUKLEME-ADIMLARI.txt echo 2) ustadkenankuzucu.com.tr altinda "monitor" adinda klasor ac
>> site\YUKLEME-ADIMLARI.txt echo 3) bu klasordeki TUM dosyalari oraya yukle
>> site\YUKLEME-ADIMLARI.txt echo 4) Adres: https://ustadkenankuzucu.com.tr/monitor/
>> site\YUKLEME-ADIMLARI.txt echo.
>> site\YUKLEME-ADIMLARI.txt echo NOT: 3D kure icin internet gerekir (globe.gl CDN).
>> site\YUKLEME-ADIMLARI.txt echo NOT: Anahtarlar ve kisisel notlar bu kopyada YOK (temiz surum).

echo.
echo  [OK] site klasoru hazir: %CD%\site
echo  YUKLEME-ADIMLARI.txt dosyasindaki adimlari izle.
explorer "site"
pause
