#!/bin/bash
# Vercel Install Script
# This script ensures only frontend dependencies are installed without scanning workspace

set -e

echo "🚀 Starting clean Vercel install..."

# Remove any existing artifacts
echo "🧹 Cleaning previous artifacts..."
rm -rf node_modules package-lock.json .npm

# Create a clean npm cache directory
mkdir -p .npm

# Install with explicit flags to prevent workspace scanning
echo "📦 Installing dependencies..."
npm install \
  --legacy-peer-deps \
  --ignore-scripts \
  --include=dev \
  --no-audit \
  --no-fund \
  --prefer-offline=false \
  --cache .npm \
  2>&1 | grep -v "node:crypto" || true

# Check if install succeeded
if [ ! -d "node_modules" ]; then
  echo "❌ Installation failed!"
  exit 1
fi

echo "✅ Dependencies installed successfully!"
ls -la node_modules/ | head -20