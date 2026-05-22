@echo off
REM Blumebyte Edge Function Deployment Script for Windows
REM Run this script to deploy your edge function without Figma Make

echo ==================================================
echo   Blumebyte Edge Function Deployment
echo ==================================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Supabase CLI...
    npm install -g supabase
    echo Supabase CLI installed
) else (
    echo Supabase CLI already installed
)

echo.
echo Step 1: Logging into Supabase...
supabase login

echo.
echo Step 2: Linking to your project...
supabase link --project-ref ivohczdtuxasyfoiphqu

echo.
echo Step 3: Copying all function files to make-server...
copy /Y supabase\functions\server\index.tsx supabase\functions\make-server-a35148f0\
copy /Y supabase\functions\server\kv_store.tsx supabase\functions\make-server-a35148f0\
copy /Y supabase\functions\server\currency-utils.tsx supabase\functions\make-server-a35148f0\
copy /Y supabase\functions\server\company-utils.tsx supabase\functions\make-server-a35148f0\
copy /Y supabase\functions\server\license-routes.tsx supabase\functions\make-server-a35148f0\ 2>nul
copy /Y supabase\functions\server\user-creation-fixed.tsx supabase\functions\make-server-a35148f0\ 2>nul

echo Files copied

echo.
echo Step 4: Deploying edge function...
supabase functions deploy make-server-a35148f0 --no-verify-jwt

echo.
echo Step 5: Setting environment variables...
echo WARNING: Set environment variables in Supabase Dashboard:
echo    1. Go to: https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/settings/functions
echo    2. Add secrets: PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY

echo.
echo Step 6: Testing deployment...
echo Calling health endpoint...
curl "https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server-a35148f0/make-server-a35148f0/health"

echo.
echo.
echo ==================================================
echo   DEPLOYMENT COMPLETE!
echo ==================================================
echo.
echo Next steps:
echo 1. Set environment variables (see above)
echo 2. Test your endpoints
echo 3. Your app should work now!
echo.
pause
