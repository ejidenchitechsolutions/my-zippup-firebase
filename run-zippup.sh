#!/bin/bash

# ZippUp Platform Runner Script
echo "🚀 Starting ZippUp Multi-Platform Solution..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists flutter; then
    echo -e "${YELLOW}⚠️  Flutter is not installed. Mobile app won't run.${NC}"
    FLUTTER_AVAILABLE=false
else
    FLUTTER_AVAILABLE=true
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Deploy Firebase Functions (optional)
read -p "🔥 Do you want to deploy Firebase functions? (y/n): " deploy_functions
if [[ $deploy_functions =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔥 Deploying Firebase functions...${NC}"
    cd functions
    npm install
    npm run build
    firebase deploy --only functions
    cd ..
    echo -e "${GREEN}✅ Firebase functions deployed${NC}"
fi

# Function to run in new terminal/tab
run_in_background() {
    local name=$1
    local command=$2
    local port=$3
    
    echo -e "${BLUE}🚀 Starting $name on port $port...${NC}"
    
    # Try different terminal emulators
    if command_exists gnome-terminal; then
        gnome-terminal --tab --title="$name" -- bash -c "$command; exec bash"
    elif command_exists xterm; then
        xterm -title "$name" -e "$command" &
    elif command_exists konsole; then
        konsole --new-tab -e bash -c "$command; exec bash" &
    else
        echo -e "${YELLOW}⚠️  No terminal emulator found. Running $name in background...${NC}"
        eval "$command" &
    fi
}

# Start React Web App
echo -e "${BLUE}🌐 Setting up React Web App...${NC}"
cd web
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

run_in_background "ZippUp Web App" "cd $(pwd) && npm start" "3000"
cd ..

# Start Vue Admin Dashboard
echo -e "${BLUE}🛠️  Setting up Vue Admin Dashboard...${NC}"
cd admin
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

run_in_background "ZippUp Admin Dashboard" "cd $(pwd) && npm run dev" "5173"
cd ..

# Start Flutter Mobile App (if available)
if [ "$FLUTTER_AVAILABLE" = true ]; then
    echo -e "${BLUE}📱 Setting up Flutter Mobile App...${NC}"
    cd mobile
    
    echo "📦 Getting Flutter dependencies..."
    flutter pub get
    
    echo "🌐 Enabling web support..."
    flutter config --enable-web
    
    run_in_background "ZippUp Mobile App" "cd $(pwd) && flutter run -d chrome" "chrome"
    cd ..
else
    echo -e "${YELLOW}⚠️  Skipping Flutter mobile app (Flutter not installed)${NC}"
fi

# Wait a moment for services to start
sleep 3

echo ""
echo -e "${GREEN}🎉 ZippUp Platform is starting up!${NC}"
echo ""
echo -e "${BLUE}📱 Access your applications:${NC}"
echo -e "🌐 Web App:           ${GREEN}http://localhost:3000${NC}"
echo -e "🛠️  Admin Dashboard:   ${GREEN}http://localhost:5173${NC}"
if [ "$FLUTTER_AVAILABLE" = true ]; then
    echo -e "📱 Mobile App:        ${GREEN}Will open in Chrome automatically${NC}"
fi
echo ""
echo -e "${BLUE}🔥 Firebase Project:  ${GREEN}zippup-demo${NC}"
echo -e "${BLUE}📊 Firebase Console:  ${GREEN}https://console.firebase.google.com/project/zippup-demo${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "• All apps are configured with your Firebase project"
echo "• Emergency button works with mock data"
echo "• Use Chrome DevTools to simulate mobile devices"
echo "• Check browser console for any errors"
echo ""
echo -e "${GREEN}🚀 Enjoy exploring your ZippUp platform!${NC}"

# Keep script running
echo "Press Ctrl+C to stop all services"
wait