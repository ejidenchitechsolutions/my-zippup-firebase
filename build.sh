#!/bin/bash

echo "🚀 Starting ZippUp Platform Build..."
echo "====================================="

# Set error handling
set -e

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root."
    exit 1
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build the web application
echo "🌐 Building React Web Application..."
cd web

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: web/package.json not found."
    exit 1
fi

# Install web dependencies
echo "📦 Installing web dependencies..."
npm install

# Build the web app
echo "🔨 Building web application..."
npm run build

# Verify build output
if [ ! -d "build" ]; then
    echo "❌ Error: Build directory not created."
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build output: web/build/"

# List build contents
echo "📋 Build contents:"
ls -la build/

cd ..

echo "🎉 ZippUp Platform build completed successfully!"