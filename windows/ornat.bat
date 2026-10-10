@echo off
chcp 65001 >nul
setlocal
title Jarima maydonchasi - o'rnatish

net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo  Administrator huquqi kerak.
  echo  Ushbu faylni o'ng tugma bilan bosib "Run as administrator" ni tanlang.
  echo.
  pause
  exit /b 1
)

set "MANBA=%~dp0terminal.exe"
set "PAPKA=%ProgramFiles%\Jarima"
set "EXE=%PAPKA%\terminal.exe"

if not exist "%MANBA%" (
  echo  terminal.exe shu papkada topilmadi: %~dp0
  pause
  exit /b 1
)

echo  [1/6] Fayl ko'chirilmoqda: %PAPKA%
if not exist "%PAPKA%" mkdir "%PAPKA%"
"%SystemRoot%\System32\sc.exe" stop JarimaTerminal >nul 2>&1
timeout /t 2 /nobreak >nul
copy /y "%MANBA%" "%EXE%" >nul || (echo  Fayl ko'chirilmadi & pause & exit /b 1)

echo  [2/6] WebView2 komponenti tekshirilmoqda (dastur oynasi uchun)
set "WV=0"
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv >nul 2>&1 && set "WV=1"
reg query "HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv >nul 2>&1 && set "WV=1"
reg query "HKCU\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv >nul 2>&1 && set "WV=1"
if "%WV%"=="1" (
  echo       WebView2 bor.
) else (
  if exist "%~dp0MicrosoftEdgeWebview2Setup.exe" (
    echo       O'rnatilmoqda... internet kerak, 1-2 daqiqa.
    copy /y "%~dp0MicrosoftEdgeWebview2Setup.exe" "%PAPKA%\" >nul
    "%~dp0MicrosoftEdgeWebview2Setup.exe" /silent /install
    if errorlevel 1 (
      echo       DIQQAT: WebView2 o'rnatilmadi. Internetsiz kompyuterda
      echo       "Evergreen Standalone Installer" ni Microsoft saytidan
      echo       yuklab, qo'lda o'rnating.
    )
  ) else (
    echo       DIQQAT: MicrosoftEdgeWebview2Setup.exe topilmadi.
  )
)

echo  [3/6] Tarmoq ruxsatlari (hovli telefoni va kamera)
netsh advfirewall firewall delete rule name="Jarima terminal (HTTP)" >nul 2>&1
netsh advfirewall firewall delete rule name="Jarima kamera (FTP)" >nul 2>&1
netsh advfirewall firewall add rule name="Jarima terminal (HTTP)" dir=in action=allow protocol=TCP localport=8080 profile=private,domain >nul
netsh advfirewall firewall add rule name="Jarima kamera (FTP)" dir=in action=allow protocol=TCP localport=2121 profile=private,domain >nul

echo  [4/6] Xizmat o'rnatilmoqda (24/7 ishlaydi)
"%EXE%" -xizmat o'chir >nul 2>&1
"%EXE%" -xizmat o'rnat || (echo  Xizmat o'rnatilmadi & pause & exit /b 1)
"%EXE%" -xizmat boshla

echo  [5/6] Yorliqlar yaratilmoqda
powershell -NoProfile -Command ^
 "$w=New-Object -ComObject WScript.Shell;" ^
 "$d=[Environment]::GetFolderPath('CommonDesktopDirectory');" ^
 "$m=[Environment]::GetFolderPath('CommonStartMenu')+'\Programs';" ^
 "foreach($p in @($d,$m)){" ^
 "  $s=$w.CreateShortcut($p+'\Jarima maydonchasi.lnk');" ^
 "  $s.TargetPath='%EXE%'; $s.Arguments='-faqat-oyna';" ^
 "  $s.IconLocation='%EXE%,0'; $s.WorkingDirectory='%PAPKA%';" ^
 "  $s.Description='Jarima maydonchasi - operator ish o''rni'; $s.Save();" ^
 "  $g=$w.CreateShortcut($p+'\Jarima - darvoza ekrani.lnk');" ^
 "  $g.TargetPath='%EXE%'; $g.Arguments='-faqat-oyna -yol /darvoza.html';" ^
 "  $g.IconLocation='%EXE%,0'; $g.WorkingDirectory='%PAPKA%';" ^
 "  $g.Description='Haydovchi ekrani (chiqish darvozasi)'; $g.Save(); }"

echo  [6/6] Tayyor.
echo.
echo   Xizmat:      JarimaTerminal (avtomatik ishga tushadi)
echo   Ma'lumot:    %ProgramData%\Jarima
echo   Ish o'rni:   ish stolidagi "Jarima maydonchasi" yorlig'i
echo   Darvoza:     "Jarima - darvoza ekrani" yorlig'i (2-monitorda)
echo   Hovli tel.:  http://%COMPUTERNAME%:8080  (Sozlamalar - QR kod)
echo.
"%EXE%" -xizmat holat
echo.
start "" "%EXE%" -faqat-oyna
pause
