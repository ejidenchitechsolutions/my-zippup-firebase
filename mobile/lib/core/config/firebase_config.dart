import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return web;
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAYChC9Zd2KjC9hEP29g1MpNXEc6_97YdE',
    authDomain: 'zippup-demo.firebaseapp.com',
    projectId: 'zippup-demo',
    storageBucket: 'zippup-demo.firebasestorage.app',
    messagingSenderId: '469588069805',
    appId: '1:469588069805:web:bc2f623680e1ee21fe6524',
    measurementId: 'G-TJCXYJSZRP',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAYChC9Zd2KjC9hEP29g1MpNXEc6_97YdE',
    authDomain: 'zippup-demo.firebaseapp.com',
    projectId: 'zippup-demo',
    storageBucket: 'zippup-demo.firebasestorage.app',
    messagingSenderId: '469588069805',
    appId: '1:469588069805:android:your-android-app-id',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAYChC9Zd2KjC9hEP29g1MpNXEc6_97YdE',
    authDomain: 'zippup-demo.firebaseapp.com',
    projectId: 'zippup-demo',
    storageBucket: 'zippup-demo.firebasestorage.app',
    messagingSenderId: '469588069805',
    appId: '1:469588069805:ios:your-ios-app-id',
    iosClientId: 'your-ios-client-id.googleusercontent.com',
    iosBundleId: 'com.zippup.mobile',
  );
}