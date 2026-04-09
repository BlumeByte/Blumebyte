@echo off
echo ====================================
echo Deploying Blumebyte to Supabase
echo ====================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Supabase CLI not found!
    echo.
    echo Please install Supabase CLI:
    echo   Option 1: scoop install supabase
    echo   Option 2: Download from https://github.com/supabase/cli/releases
    echo.
    pause
    exit /b 1
)

echo Step 1: Checking Supabase login...
supabase projects list >nul 2>nul
if %errorlevel% neq 0 (
    echo Please login to Supabase...
    supabase login
    if %errorlevel% neq 0 (
        echo ERROR: Login failed!
        pause
        exit /b 1
    )
)

echo Step 2: Linking project...
supabase link --project-ref ivohczdtuxasyfoiphqu
if %errorlevel% neq 0 (
    echo ERROR: Failed to link project!
    echo Please ensure you have access to the project and try again.
    pause
    exit /b 1
)

echo Step 3: Deploying make-server function...
supabase functions deploy make-server
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed!
    echo Please check the error message above.
    pause
    exit /b 1
)

echo.
echo ====================================
echo ✅ DEPLOYMENT SUCCESSFUL!
echo ====================================
echo.
echo Testing health endpoint...
echo.
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-668731fc/health
echo.
echo.
echo ====================================
echo Done! Your function is now deployed.
echo ====================================
pause
