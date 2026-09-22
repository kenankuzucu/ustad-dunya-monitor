@echo off
chcp 65001 >nul
title USTAD MONITOR - RTL-SDR (kendi alicin)
cd /d "%~dp0"
echo ============================================================
echo   USTAD DUNYA MONITORU - RTL-SDR KENDI ALICIN
echo ============================================================
echo.
echo   Bu betik, RTL-SDR cubugun takiliysa UCAK verisini (ADS-B)
echo   kendi anteninden dinler ve panele yazar (veri\adsb.js).
echo   Donanim yoksa hicbir sey bozulmaz; panel internetten devam eder.
echo.

where rtl_adsb >nul 2>nul
if %errorlevel%==0 goto calistir
if exist "C:\rtl-sdr\rtl_adsb.exe" (set RTL=C:\rtl-sdr\rtl_adsb.exe & goto calistir2)
if exist "%LOCALAPPDATA%\rtl-sdr\rtl_adsb.exe" (set RTL=%LOCALAPPDATA%\rtl-sdr\rtl_adsb.exe & goto calistir2)
if exist "C:\Program Files\dump1090\dump1090.exe" (set DUMP=C:\Program Files\dump1090\dump1090.exe & goto dump)
if exist "C:\rtl-sdr\dump1090.exe" (set DUMP=C:\rtl-sdr\dump1090.exe & goto dump)

echo  [!] RTL-SDR araclari bulunamadi (rtl_adsb / dump1090).
echo.
echo  Kurulum (donanim aldiysan):
echo    1) RTL-SDR cubugunu tak (RTL2832U + R820T2 onerilir)
echo    2) Zadig ile surucu: Bulk-In Interface 0 -> WinUSB
echo    3) rtl-sdr bina dosyalarini indir: https://ftp.osmocom.org/binaries/windows/rtl-sdr/
echo       icindeki rtl_adsb.exe dosyasini C:\rtl-sdr\ klasorune cikar
echo    4) Bu betigi tekrar calistir
echo.
echo  Not: dump1090 kuruluysa o da otomatik bulunur.
echo.
pause
exit /b

:calistir
echo  rtl_adsb bulundu (PATH). Baslatiliyor... (kapatmak icin Ctrl+C)
if not exist "veri" mkdir veri
rtl_adsb --net > veri\adsb-ham.txt
goto bitti

:calistir2
echo  rtl_adsb bulundu: %RTL%
if not exist "veri" mkdir veri
"%RTL%" > veri\adsb-ham.txt
goto bitti

:dump
echo  dump1090 bulundu: %DUMP%
if not exist "veri" mkdir veri
"%DUMP%" --net-ro-port 30002 > veri\adsb-ham.txt
goto bitti

:bitti
echo.
echo  Ham veri: veri\adsb-ham.txt
echo  Panel: AYARLAR > 🩺 teshis ekranindan durumu takip et.
pause
