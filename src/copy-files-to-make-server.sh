#!/bin/bash

# Script to copy all files from server/ to make-server/
# This fixes the 403 deployment error

echo "========================================="
echo "Copying files to make-server directory"
echo "========================================="
echo

SOURCE_DIR="supabase/functions/server"
DEST_DIR="supabase/functions/make-server"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "ERROR: Source directory $SOURCE_DIR not found!"
    exit 1
fi

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Copy all .tsx files
echo "Copying .tsx files..."
cp "$SOURCE_DIR"/*.tsx "$DEST_DIR/" 2>/dev/null

# Copy deno.json
echo "Copying deno.json..."
cp "$SOURCE_DIR/deno.json" "$DEST_DIR/" 2>/dev/null

# Copy any .md files
echo "Copying documentation..."
cp "$SOURCE_DIR"/*.md "$DEST_DIR/" 2>/dev/null

echo
echo "========================================="
echo "✅ Files copied successfully!"
echo "========================================="
echo

# List files in destination
echo "Files in $DEST_DIR:"
ls -la "$DEST_DIR"

echo
echo "========================================="
echo "Next steps:"
echo "1. Verify index.tsx exists in make-server/"
echo "2. Deploy using Figma Make OR"
echo "3. Run: supabase functions deploy make-server"
echo "========================================="
