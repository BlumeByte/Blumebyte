#!/bin/bash

# Phase 11 Manual Deployment Script
# Run this if Figma Make deployment fails with 403 error

echo "🚀 PHASE 11 - MANUAL SUPABASE DEPLOYMENT"
echo "========================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "📝 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged in to Supabase"
    echo ""
    echo "Logging in now..."
    supabase login
    
    if [ $? -ne 0 ]; then
        echo "❌ Login failed"
        exit 1
    fi
fi

echo "✅ Logged in to Supabase"
echo ""

# Link project if not already linked
echo "🔗 Linking to project: ivohczdtuxasyfoiphqu..."
supabase link --project-ref ivohczdtuxasyfoiphqu

if [ $? -ne 0 ]; then
    echo "❌ Project linking failed"
    echo "   Please check your database password"
    exit 1
fi

echo "✅ Project linked"
echo ""

# Deploy the edge function
echo "🚀 Deploying 'server' edge function..."
echo "   This may take 1-2 minutes..."
echo ""

supabase functions deploy make-server-a35148f0 --no-verify-jwt

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check your internet connection"
    echo "2. Verify project status at: https://supabase.com/dashboard"
    echo "3. Ensure billing is current"
    echo "4. Check for deployment restrictions in Organization settings"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

# Verify deployment
echo "🔍 Verifying deployment..."
echo ""

HEALTH_URL="https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server-a35148f0/make-server-a35148f0/health"

echo "Testing health endpoint:"
echo "  $HEALTH_URL"
echo ""

if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s "$HEALTH_URL")
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    if echo "$RESPONSE" | grep -q "\"status\":\"ok\""; then
        echo "✅ Health check passed!"
        echo ""
        echo "🎉 DEPLOYMENT COMPLETE!"
        echo ""
        echo "Next steps:"
        echo "1. Clear your browser cache (Ctrl+Shift+R)"
        echo "2. Test the branding system in Settings"
        echo "3. Check console for debug logs (🎨 and 🔍 emojis)"
    else
        echo "⚠️  Health check returned unexpected response"
        echo "   The function deployed but may have runtime issues"
        echo "   Check logs at: https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/functions"
    fi
else
    echo "⚠️  curl not found - cannot verify health check"
    echo "   Please test manually in your browser:"
    echo "   $HEALTH_URL"
fi

echo ""
echo "📊 View function logs:"
echo "   https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/functions"
echo ""
echo "📝 See PHASE_11_DEPLOYMENT_FIX.md for more details"
echo ""
