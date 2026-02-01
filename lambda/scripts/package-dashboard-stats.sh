#!/bin/bash

# Package Dashboard Stats Lambda Functions
# Упаковка Lambda функций для dashboard статистики

set -e

echo "📦 Packaging Dashboard Stats Lambda Functions..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Package Client Dashboard Stats
echo "📦 Packaging client-dashboard-stats..."
cd build/core/profiles
zip -r ../../../dist/clients-dashboard-stats.zip get-client-dashboard-stats.js
cd ../../..

# Package Master Dashboard Stats
echo "📦 Packaging master-dashboard-stats..."
cd build/core/profiles
zip -r ../../../dist/masters-dashboard-stats.zip get-master-dashboard-stats.js
cd ../../..

echo "✅ Dashboard Stats Lambda functions packaged successfully!"
echo ""
echo "Created files:"
echo "  - dist/clients-dashboard-stats.zip"
echo "  - dist/masters-dashboard-stats.zip"
