@echo off
chcp 65001 >nul
setlocal
title Jarima maydonchasi - o'chirish

net session >nul 2>&1
if errorlevel 1 (
  echo  Administrator huquqi kerak. O'ng tugma - "Run as administrator".
  pause
  exit /b 1
)

set "PAPKA=%ProgramFiles%\Jarima"
set "EXE=%PAPKA%\terminal.exe"

echo  Xizmat to'xtatilmoqda va o'chirilmoqda...
if exist "%EXE%" "%EXE%" -xizmat to'xtat >nul 2>&1
if exist "%EXE%" "%EXE%" -xizmat o'chir

echo  Tarmoq ruxsatlari olib tashlanmoqda...
netsh advfirewall firewall delete rule name="Jarima terminal (HTTP)" >nul 2>&1
netsh advfirewall firewall delete rule name="Jarima kamera (FTP)" >nul 2>&1

echo  Yorliqlar olib tashlanmoqda...
powershell -NoProfile -Command ^
 "$d=[Environment]::GetFolderPath('CommonDesktopDirectory');" ^
 "$m=[Environment]::GetFolderPath('CommonStartMenu')+'\Programs';" ^
 "foreach($p in @($d,$m)){ Remove-Item -Force -ErrorAction SilentlyContinue ($p+'\Jarima maydonchasi.lnk'), ($p+'\Jarima - darvoza ekrani.lnk') }"

timeout /t 2 /nobreak >nul
rd /s /q "%PAPKA%" >nul 2>&1

echo.
echo  Dastur o'chirildi.
echo  DIQQAT: ma'lumot va fotolar SAQLANDI: %ProgramData%\Jarima
echo  Ularni ham o'chirmoqchi bo'lsangiz, o'sha papkani qo'lda o'chiring.
echo.
pause
