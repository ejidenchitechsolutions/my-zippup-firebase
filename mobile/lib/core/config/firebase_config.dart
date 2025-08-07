import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return web;
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyD6IF-c6Ce0iSpEDITpaUGJ20y7_ZZxHl0', // Updated API Key
    authDomain: 'zippup-demo.firebaseapp.com',
    projectId: 'zippup-demo',
    storageBucket: 'zippup-demo.firebasestorage.app',
    messagingSenderId: '469588069805',
    appId: '1:469588069805:web:bc2f623680e1ee21fe6524',
    measurementId: 'G-TJCXYJSZRP',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyD6IF-c6Ce0iSpEDITpaUGJ20y7_ZZxHl0', // Updated API Key
    authDomain: 'zippup-demo.firebaseapp.com',
    projectId: 'zippup-demo',
    storageBucket: 'zippup-demo.firebasestorage.app',
    messagingSenderId: '469588069805',
    appId: '1:469588069805:android:your-android-app-id',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyD6IF-c6Ce0iSpEDITpaUGJ20y7_ZZxHl0', // Updated API Key
    authDomain: 'zippup-demo.firebaseapp.com',
    projectId: 'zippup-demo',
    storageBucket: 'zippup-demo.firebasestorage.app',
    messagingSenderId: '469588069805',
    appId: '1:469588069805:ios:your-ios-app-id',
    iosClientId: 'your-ios-client-id.googleusercontent.com',
    iosBundleId: 'com.zippup.mobile',
  );
}

// Google Maps API configuration
class GoogleMapsConfig {
  static const String apiKey = 'AIzaSyD6IF-c6Ce0iSpEDITpaUGJ20y7_ZZxHl0';
  
  // Default location (New York City)
  static const double defaultLat = 40.7128;
  static const double defaultLng = -74.0060;
  
  // Map styling options
  static const double defaultZoom = 12.0;
  static const double detailZoom = 15.0;
  static const double providerSearchRadius = 10.0; // kilometers
  
  // Map marker types
  static const String providerMarker = 'provider';
  static const String userMarker = 'user';
  static const String emergencyMarker = 'emergency';
  static const String destinationMarker = 'destination';
}