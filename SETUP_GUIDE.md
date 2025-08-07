# 🚀 ZippUp Platform - Setup & Run Guide

This guide will help you run all three applications to see the complete ZippUp platform in action.

## 📋 Prerequisites

Before starting, make sure you have:

```bash
# Check if you have these installed
node --version    # Should be 18+
npm --version     # Should be 8+
flutter --version # Should be 3.10+
```

If you don't have them:

```bash
# Install Node.js (18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Flutter
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"
flutter doctor

# Install Firebase CLI
npm install -g firebase-tools
```

## 🔥 1. Firebase Backend Setup

```bash
# Navigate to the project root
cd /workspace

# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase (you'll need a Google account)
firebase login

# Initialize a new Firebase project (if you don't have one)
firebase projects:create zippup-demo --display-name "ZippUp Demo"

# Set the project
firebase use zippup-demo

# Install functions dependencies
cd functions
npm install

# Build the functions
npm run build

# Deploy to Firebase (this will create the backend)
firebase deploy

# Set up environment variables (optional for demo)
firebase functions:config:set stripe.secret_key="sk_test_demo" stripe.webhook_secret="whsec_demo"
```

## 📱 2. Flutter Mobile App

### Option A: Run on Web Browser (Easiest)
```bash
# Navigate to mobile app
cd /workspace/mobile

# Install dependencies
flutter pub get

# Enable web support
flutter config --enable-web

# Run on web browser
flutter run -d chrome
```

### Option B: Run on Android Emulator
```bash
# Start Android emulator first (if you have Android Studio)
# Or connect a physical Android device

# Run the app
flutter run
```

### Option C: View Flutter Code Structure
```bash
# View the main app file
cat /workspace/mobile/lib/main.dart

# View home screen
cat /workspace/mobile/lib/features/home/screens/home_screen.dart

# View emergency button
cat /workspace/mobile/lib/shared/widgets/emergency_button.dart
```

## 🌐 3. React Web Application

```bash
# Navigate to web app
cd /workspace/web

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOL
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=zippup-demo.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=zippup-demo
REACT_APP_FIREBASE_STORAGE_BUCKET=zippup-demo.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
EOL

# Start development server
npm start

# The web app will open at http://localhost:3000
```

## 🛠️ 4. Vue.js Admin Dashboard

```bash
# Navigate to admin dashboard
cd /workspace/admin

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOL
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=zippup-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zippup-demo
VITE_FIREBASE_STORAGE_BUCKET=zippup-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
EOL

# Start development server
npm run dev

# The admin dashboard will open at http://localhost:5173
```

## 🎯 Quick Demo Setup (No Firebase Required)

If you want to see the UI without setting up Firebase:

### 1. Mock Data Setup

```bash
# Create mock Firebase service for web app
cat > /workspace/web/src/services/mockFirebase.js << 'EOL'
// Mock Firebase for demo purposes
export const mockAuth = {
  currentUser: {
    uid: 'demo-user',
    email: 'demo@zippup.com',
    displayName: 'Demo User'
  }
};

export const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({
        exists: true,
        data: () => ({ name: 'Demo Data' })
      })
    })
  })
};

export const mockFunctions = {
  httpsCallable: (name) => (data) => Promise.resolve({
    data: { success: true, message: `Mock ${name} response` }
  })
};
EOL

# Create mock data for mobile app
mkdir -p /workspace/mobile/lib/core/services
cat > /workspace/mobile/lib/core/services/mock_service.dart << 'EOL'
class MockFirebaseService {
  static Future<Map<String, dynamic>> mockResponse(String functionName) async {
    await Future.delayed(Duration(seconds: 1)); // Simulate network delay
    return {
      'success': true,
      'message': 'Mock $functionName response',
      'data': {'demo': true}
    };
  }
}
EOL
```

### 2. Run with Mock Data

```bash
# Terminal 1: Run React Web App
cd /workspace/web
REACT_APP_DEMO_MODE=true npm start

# Terminal 2: Run Flutter Web App  
cd /workspace/mobile
flutter run -d chrome

# Terminal 3: Run Vue Admin Dashboard
cd /workspace/admin
VITE_DEMO_MODE=true npm run dev
```

## 📱 What You'll See

### Flutter Mobile App (http://localhost:3000 or Chrome)
- **Beautiful home screen** with service categories
- **Prominent emergency button** that pulses
- **Service category grid** with icons and colors
- **Search bar** for finding services
- **Wallet display** showing balance
- **Navigation** between different screens

### React Web App (http://localhost:3000)
- **Hero section** with gradient background
- **Service categories** in a responsive grid
- **Emergency services banner** 
- **Search functionality**
- **Booking interface**
- **User dashboard**

### Vue Admin Dashboard (http://localhost:5173)
- **Real-time metrics** dashboard
- **Emergency monitoring** with alerts
- **User management** interface
- **Analytics charts** and graphs
- **System status** indicators
- **Navigation sidebar** with all admin features

## 🎨 UI Features You'll Experience

### 🎯 **Interactive Elements**
- **Hover effects** on cards and buttons
- **Smooth animations** and transitions
- **Loading states** and progress indicators
- **Form validation** with real-time feedback

### 🚨 **Emergency Features**
- **Panic button** with pulsing animation
- **Countdown timer** (5 seconds)
- **Emergency type selection**
- **Location display**
- **Provider dispatch simulation**

### 💳 **Payment Interface**
- **Wallet balance** display
- **Top-up interface** with Stripe simulation
- **Transaction history**
- **Payment method selection**

### 📊 **Admin Analytics**
- **Real-time charts** using ApexCharts
- **Live statistics** with animated counters
- **Emergency alert popups**
- **Data tables** with sorting and filtering

## 🔧 Troubleshooting

### Common Issues:

1. **Port already in use**
   ```bash
   # Kill processes on ports
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5173 | xargs kill -9
   ```

2. **Node modules issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Flutter web issues**
   ```bash
   # Enable web and clean
   flutter config --enable-web
   flutter clean
   flutter pub get
   ```

## 📸 Screenshots Guide

To capture what you're seeing:

```bash
# Take screenshots of each app
# Mobile app: Right-click -> Inspect -> Toggle device toolbar
# Web app: Full browser window
# Admin: Full browser window with sidebar expanded
```

## 🎥 Video Demo

You can record your screen while navigating through:

1. **Mobile app**: Service selection → Emergency button → Booking flow
2. **Web app**: Homepage → Service search → User dashboard  
3. **Admin**: Dashboard overview → Emergency monitoring → User management

## 🚀 Next Steps

Once you see the UIs working:

1. **Customize branding** - Update colors, logos, text
2. **Add real Firebase** - Connect to live backend
3. **Test features** - Try booking flows and emergency system
4. **Deploy** - Host on Firebase/Vercel/Netlify

---

**You now have a complete multi-platform solution running locally!** 🎉

The UIs demonstrate a production-ready platform with beautiful design, smooth interactions, and comprehensive functionality across mobile, web, and admin interfaces.