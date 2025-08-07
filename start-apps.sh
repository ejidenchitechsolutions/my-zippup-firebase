#!/bin/bash

echo "🚀 Starting ZippUp Development Servers..."
echo "========================================"

# Kill any existing processes on ports 3000 and 5173
echo "🔄 Cleaning up existing processes..."
pkill -f "npm start" || true
pkill -f "npm run dev" || true
pkill -f "vite" || true
sleep 2

# Start React Web App
echo "📱 Starting React Web App on port 3000..."
cd /workspace/web
npm start > /tmp/web-app.log 2>&1 &
WEB_PID=$!
echo "Web app started with PID: $WEB_PID"

# Wait a moment
sleep 3

# Start Vue Admin Dashboard  
echo "🛠️ Starting Vue Admin Dashboard on port 5173..."
cd /workspace/admin
npm run dev > /tmp/admin-app.log 2>&1 &
ADMIN_PID=$!
echo "Admin app started with PID: $ADMIN_PID"

# Wait for servers to start
echo "⏳ Waiting for servers to initialize..."
sleep 10

echo ""
echo "🎉 ZippUp Development Servers Started!"
echo "======================================"
echo "📱 React Web App:     http://localhost:3000"
echo "🛠️ Vue Admin Panel:   http://localhost:5173"
echo ""
echo "📋 Server Status:"
echo "Web App PID:    $WEB_PID"
echo "Admin App PID:  $ADMIN_PID"
echo ""
echo "📝 Logs:"
echo "Web App:   tail -f /tmp/web-app.log"
echo "Admin App: tail -f /tmp/admin-app.log"
echo ""
echo "🛑 To stop servers: pkill -f 'npm start' && pkill -f 'npm run dev'"
echo ""

# Check if servers are responding
echo "🔍 Checking server status..."
sleep 5

# Simple check for web app
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web App (port 3000): RUNNING"
else
    echo "❌ Web App (port 3000): NOT RESPONDING"
fi

# Simple check for admin app  
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Admin App (port 5173): RUNNING"
else
    echo "❌ Admin App (port 5173): NOT RESPONDING"
fi

echo ""
echo "🎯 Ready to test your ZippUp platform!"
echo "Open the URLs above in your browser to see the applications."