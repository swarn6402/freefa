@echo off
setlocal EnableExtensions

set "ROOT_DIR=C:\Users\swarn\Downloads\wc2026\wc2026"
set "ENV_FILE=%ROOT_DIR%\.env.local"
set "API_URL=https://freefifa.vercel.app/api/telegram"
set "CRON_SECRET="

if not exist "%ENV_FILE%" (
  echo Could not find .env.local at:
  echo %ENV_FILE%
  echo.
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
  if /I "%%A"=="CRON_SECRET" set "CRON_SECRET=%%B"
)

if not defined CRON_SECRET (
  echo CRON_SECRET was not found in:
  echo %ENV_FILE%
  echo.
  pause
  exit /b 1
)

echo Triggering FreeFA Telegram scrape...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$headers=@{'x-cron-secret'='%CRON_SECRET%'}; try { $response=Invoke-WebRequest -Uri '%API_URL%' -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 120; Write-Host ('Status: ' + $response.StatusCode); Write-Host $response.Content; exit 0 } catch { if ($_.Exception.Response) { $status=[int]$_.Exception.Response.StatusCode; $reader=New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $body=$reader.ReadToEnd(); Write-Host ('Status: ' + $status); Write-Host $body; exit 1 } Write-Host $_.Exception.Message; exit 1 }"

echo.
if errorlevel 1 (
  echo FreeFA update failed.
) else (
  echo FreeFA update completed.
)

echo.
pause
