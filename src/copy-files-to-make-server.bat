@echo off
REM Script to copy all files from server/ to make-server-a35148f0/
REM This fixes the 403 deployment error

echo =========================================
echo Copying files to make-server-a35148f0 directory
echo =========================================
echo.

set SOURCE_DIR=supabase\functions\server
set DEST_DIR=supabase\functions\make-server-a35148f0

REM Check if source directory exists
if not exist "%SOURCE_DIR%" (
    echo ERROR: Source directory %SOURCE_DIR% not found!
    pause
    exit /b 1
)

REM Create destination directory if it doesn't exist
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

REM Copy all .tsx files
echo Copying .tsx files...
copy /Y "%SOURCE_DIR%\*.tsx" "%DEST_DIR%\" > nul 2>&1

REM Copy deno.json
echo Copying deno.json...
copy /Y "%SOURCE_DIR%\deno.json" "%DEST_DIR%\" > nul 2>&1

REM Copy any .md files
echo Copying documentation...
copy /Y "%SOURCE_DIR%\*.md" "%DEST_DIR%\" > nul 2>&1

echo.
echo =========================================
echo ✅ Files copied successfully!
echo =========================================
echo.

REM List files in destination
echo Files in %DEST_DIR%:
dir /B "%DEST_DIR%"

echo.
echo =========================================
echo Next steps:
echo 1. Verify index.tsx exists in make-server-a35148f0/
echo 2. Deploy using Figma Make OR
echo 3. Run: supabase functions deploy make-server-a35148f0
echo =========================================
pause
