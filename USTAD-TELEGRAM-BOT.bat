@echo off
chcp 65001 >nul
title USTAD MONITOR - TELEGRAM BOT (telefondan komut)
cd /d "%~dp0"
echo ============================================================
echo   USTAD DUNYA MONITORU - TELEGRAM BOT
echo ============================================================
echo.
echo   Ilk calistirmada bot-ayar.txt olusur:
echo     1) Telegram'da @BotFather -> /newbot -> TOKEN al
echo     2) Botuna bir mesaj yaz, @userinfobot ile kendi ID'ni ogren
echo     3) bot-ayar.txt icine token ve sohbet satirlarini doldur
echo     4) Bu dosyayi tekrar calistir
echo.
echo   Telefondan yazilabilecek komutlar:
echo     /durum  /deprem  /siber  /uzay  /skor  /kur  /altin  /link  /help
echo.
where python >nul 2>nul
if %errorlevel%==0 (python telegram-bot.py) else (py telegram-bot.py)
pause
