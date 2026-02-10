@echo off
cd /d "%~dp0"

echo ==================================================
echo      Local Home Services - Mobile App Build
echo ==================================================
echo.

echo [1/3] Checking Login Status...
call npx eas whoami
if %errorlevel% neq 0 (
    echo.
    echo Please log in to your Expo account:
    call npx eas login
)

echo.
echo [2/3] Initializing Project...
if not exist "eas.json" (
    call npx eas init
) else (
    echo Project already initialized.
)

echo.
echo [3/3] Building APK...
echo This process happens on Expo servers and may take 10-20 minutes.
echo.
call npx eas build -p android --profile preview

echo.
echo ==================================================
echo Build command finished. Check the link above.
echo ==================================================
pause
