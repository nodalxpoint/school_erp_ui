@echo off
echo ==========================================
echo   School ERP - Build and Deploy Script
echo ==========================================
echo.

:: ---- CONFIGURATION - Apni settings yahan change karo ----
set PROJECT_PATH=E:\vs code\SAAS\school_erp_ui
set SERVER_USER=zohaib
set SERVER_IP=72.61.229.22
set SERVER_PATH=/opt/app2/frontend/
set BASE_HREF=/sms/
:: ----------------------------------------------------------

echo [1/3] Angular Build Chal Raha Hai...
cd /d "%PROJECT_PATH%"
call ng build --base-href %BASE_HREF%

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build fail ho gayi! Check karo errors upar.
    pause
    exit /b 1
)

echo.
echo [2/3] Build Successful! Server pe Upload Ho Raha Hai...
echo.

scp -r "%PROJECT_PATH%\dist\school-erp-angular\browser\*" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Upload fail ho gayi! SSH/SCP check karo.
    pause
    exit /b 1
)

echo.
echo [3/3] Nginx Reload Ho Raha Hai...
ssh %SERVER_USER%@%SERVER_IP% "sudo systemctl reload nginx"

echo.
echo ==========================================
echo   DONE! App live hai:
echo   http://%SERVER_IP%%BASE_HREF%
echo ==========================================
pause
