#!/bin/bash

echo "===================================="
echo "Deploying Blumebyte to Supabase"
echo "===================================="
echo

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "ERROR: Supabase CLI not found!"
    echo
    echo "Please install Supabase CLI:"
    echo "  brew install supabase/tap/supabase"
    echo
    echo "Or download from: https://github.com/supabase/cli/releases"
    exit 1
fi

echo "Step 1: Checking Supabase login..."
if ! supabase projects list &> /dev/null; then
    echo "Please login to Supabase..."
    supabase login
    if [ $? -ne 0 ]; then
        echo "ERROR: Login failed!"
        exit 1
    fi
fi

echo "Step 2: Linking project..."
supabase link --project-ref ivohczdtuxasyfoiphqu
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to link project!"
    echo "Please ensure you have access to the project and try again."
    exit 1
fi

echo "Step 3: Deploying make-server function..."
supabase functions deploy make-server
if [ $? -ne 0 ]; then
    echo "ERROR: Deployment failed!"
    echo "Please check the error message above."
    exit 1
fi

echo
echo "===================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "===================================="
echo
echo "Testing health endpoint..."
echo
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-668731fc/health
echo
echo
echo "===================================="
echo "Done! Your function is now deployed."
echo "===================================="
