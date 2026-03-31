#!/bin/bash

# Copy all files from server to make-server directory
# This ensures the make-server directory has all necessary files for deployment

echo "📦 Copying Edge Function files from 'server' to 'make-server'..."

# Create make-server directory if it doesn't exist
mkdir -p supabase/functions/make-server

# Copy all .tsx files
cp -v supabase/functions/server/*.tsx supabase/functions/make-server/

# Copy markdown files if any
cp -v supabase/functions/server/*.md supabase/functions/make-server/ 2>/dev/null || true

echo "✅ Files copied successfully!"
echo ""
echo "Files in make-server directory:"
ls -lah supabase/functions/make-server/

echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. supabase login"
echo "2. supabase link --project-ref ivohczdtuxasyfoiphqu"
echo "3. supabase functions deploy make-server"
