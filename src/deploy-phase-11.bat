@echo off
REM Phase 11 Manual Deployment Script for Windows
REM Run this if Figma Make deployment fails with 403 error

echo.
echo ========================================
echo PHASE 11 - MANUAL SUPABASE DEPLOYMENT
echo ========================================
echo.

REM Check if supabase CLI is installed
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Supabase CLI not found!
    echo.
    echo Please install it first:
    echo   npm install -g supabase
    echo.
    echo Or visit: https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

echo [OK] Supabase CLI found
echo.

REM Check if logged in
echo [INFO] Checking Supabase login status...
supabase projects list >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Not logged in to Supabase
    echo.
    echo Logging in now...
    supabase login
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login failed
        pause
        exit /b 1
    )
)

echo [OK] Logged in to Supabase
echo.

REM Link project
echo [INFO] Linking to project: ivohczdtuxasyfoiphqu...
supabase link --project-ref ivohczdtuxasyfoiphqu

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Project linking failed
    echo         Please check your database password
    pause
    exit /b 1
)

echo [OK] Project linked
echo.

REM Deploy edge function
echo [INFO] Deploying 'server' edge function...
echo        This may take 1-2 minutes...
echo.

supabase functions deploy server --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment failed
    echo.
    echo Troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Verify project status at: https://supabase.com/dashboard
    echo 3. Ensure billing is current
    echo 4. Check deployment restrictions in Organization settings
    pause
    exit /b 1
)

echo.
echo [OK] Deployment successful!
echo.

REM Verify deployment
echo [INFO] Verifying deployment...
echo.

set HEALTH_URL=https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-668731fc/health

echo Testing health endpoint:
echo   %HEALTH_URL%
echo.

where curl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Response:
    curl -s "%HEALTH_URL%"
    echo.
    echo.
    echo [OK] Check if response shows "status":"ok"
) else (
    echo [WARN] curl not found - cannot auto-verify
    echo        Please test manually in browser:
    echo        %HEALTH_URL%
)

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Clear browser cache (Ctrl+Shift+R)
echo 2. Test branding in Settings
echo 3. Check console for debug logs
echo.
echo View logs:
echo https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/functions
echo.
echo See PHASE_11_DEPLOYMENT_FIX.md for details
echo.
pause
