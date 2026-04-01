#!/bin/bash
# Blumebyte HR - Edge Function Deployment Script
# This script deploys the Supabase Edge Function to production
# Updated: January 2025 - Security patches applied (Hono 4.7.7)

echo "🚀 Blumebyte HR - Edge Function Deployment"
echo "=========================================="
echo "🔒 Security: Hono 4.7.7 (All vulnerabilities patched)"
echo ""

# Project details
PROJECT_REF="ivohczdtuxasyfoiphqu"
FUNCTION_NAME="server"
EDGE_FUNCTION_PATH="./supabase/functions/server"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI detected"
echo ""

# Check if user is logged in
echo "🔐 Checking authentication..."
if ! supabase projects list &> /dev/null
then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Authentication verified"
echo ""

# Link project (if not already linked)
echo "🔗 Linking to project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF 2>/dev/null || echo "⚠️  Project already linked or link failed (continuing...)"
echo ""

# Deploy the edge function
echo "📦 Deploying Edge Function: $FUNCTION_NAME"
echo "   Path: $EDGE_FUNCTION_PATH"
echo ""

supabase functions deploy $FUNCTION_NAME \
  --project-ref $PROJECT_REF \
  --no-verify-jwt

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🧪 Testing the deployment..."
    echo ""
    
    # Test health endpoint
    HEALTH_URL="https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/make-server-668731fc/health"
    
    echo "Testing: $HEALTH_URL"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    echo ""
    echo "HTTP Status: $HTTP_CODE"
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Edge Function is working correctly!"
        echo ""
        echo "📋 Available Endpoints:"
        echo "   Health Check: $HEALTH_URL"
        echo "   Init Payment: https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/make-server-668731fc/company/init-payment"
        echo "   Test Payment: https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/make-server-668731fc/company/test-payment"
        echo ""
    else
        echo "⚠️  Edge Function deployed but health check failed"
        echo "   Check Supabase Dashboard for logs"
        echo ""
    fi
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo ""
    echo "Common issues:"
    echo "  1. Not authenticated - run: supabase login"
    echo "  2. Wrong project - check project ref: $PROJECT_REF"
    echo "  3. Permissions issue - check Supabase organization settings"
    echo "  4. Function code error - check syntax in index.tsx"
    echo ""
    echo "For more help, see: /SUPABASE_EDGE_FUNCTION_DEPLOYMENT_FIX.md"
    echo ""
    exit 1
fi

echo "🎉 Deployment complete!"
echo ""
