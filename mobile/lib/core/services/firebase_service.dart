import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_storage/firebase_storage.dart';

class FirebaseService {
  static FirebaseAuth get auth => FirebaseAuth.instance;
  static FirebaseFunctions get functions => FirebaseFunctions.instance;
  static FirebaseFirestore get firestore => FirebaseFirestore.instance;
  static FirebaseMessaging get messaging => FirebaseMessaging.instance;
  static FirebaseStorage get storage => FirebaseStorage.instance;

  static Future<void> initialize() async {
    // Configure functions for emulator in debug mode
    // functions.useFunctionsEmulator('localhost', 5001);
    
    // Request notification permissions
    await messaging.requestPermission();
    
    // Get FCM token
    final token = await messaging.getToken();
    if (token != null) {
      print('FCM Token: $token');
      // Update user profile with FCM token
      final user = auth.currentUser;
      if (user != null) {
        await updateUserFCMToken(token);
      }
    }
  }

  // Authentication Functions
  static Future<UserCredential> signInWithEmail(String email, String password) async {
    return await auth.signInWithEmailAndPassword(email: email, password: password);
  }

  static Future<UserCredential> createUserWithEmail(String email, String password) async {
    return await auth.createUserWithEmailAndPassword(email: email, password: password);
  }

  static Future<void> signOut() async {
    await auth.signOut();
  }

  static Future<void> sendPasswordResetEmail(String email) async {
    await auth.sendPasswordResetEmail(email: email);
  }

  // Cloud Functions Calls
  static Future<Map<String, dynamic>> callFunction(String name, [Map<String, dynamic>? data]) async {
    try {
      final callable = functions.httpsCallable(name);
      final result = await callable.call(data);
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      throw _handleFirebaseError(e);
    }
  }

  // User Profile Functions
  static Future<Map<String, dynamic>> getUserProfile([String? userId]) async {
    return await callFunction('getUserProfile', userId != null ? {'userId': userId} : null);
  }

  static Future<Map<String, dynamic>> updateUserProfile(Map<String, dynamic> data) async {
    return await callFunction('updateUserProfile', data);
  }

  static Future<Map<String, dynamic>> becomeProvider(Map<String, dynamic> data) async {
    return await callFunction('becomeProvider', data);
  }

  static Future<Map<String, dynamic>> getProviderProfile([String? userId]) async {
    return await callFunction('getProviderProfile', userId != null ? {'userId': userId} : null);
  }

  static Future<Map<String, dynamic>> updateProviderProfile(Map<String, dynamic> data) async {
    return await callFunction('updateProviderProfile', data);
  }

  // Booking Functions
  static Future<Map<String, dynamic>> createBooking(Map<String, dynamic> data) async {
    return await callFunction('createBooking', data);
  }

  static Future<Map<String, dynamic>> acceptBooking(String bookingId) async {
    return await callFunction('acceptBooking', {'bookingId': bookingId});
  }

  static Future<Map<String, dynamic>> updateBookingStatus(String bookingId, String status, [String? notes]) async {
    final data = {'bookingId': bookingId, 'status': status};
    if (notes != null) data['notes'] = notes;
    return await callFunction('updateBookingStatus', data);
  }

  static Future<Map<String, dynamic>> getUserBookings({String? status, int limit = 20}) async {
    final data = <String, dynamic>{'limit': limit};
    if (status != null) data['status'] = status;
    return await callFunction('getUserBookings', data);
  }

  static Future<Map<String, dynamic>> getProviderBookings({String? status, int limit = 20}) async {
    final data = <String, dynamic>{'limit': limit};
    if (status != null) data['status'] = status;
    return await callFunction('getProviderBookings', data);
  }

  static Future<Map<String, dynamic>> getBookingDetails(String bookingId) async {
    return await callFunction('getBookingDetails', {'bookingId': bookingId});
  }

  static Future<Map<String, dynamic>> cancelBooking(String bookingId, [String? reason]) async {
    final data = {'bookingId': bookingId};
    if (reason != null) data['reason'] = reason;
    return await callFunction('cancelBooking', data);
  }

  // Emergency Functions
  static Future<Map<String, dynamic>> createEmergency(Map<String, dynamic> data) async {
    return await callFunction('createEmergency', data);
  }

  static Future<Map<String, dynamic>> panicButton(Map<String, dynamic> location, [String? description]) async {
    final data = {'location': location};
    if (description != null) data['description'] = description;
    return await callFunction('panicButton', data);
  }

  static Future<Map<String, dynamic>> acceptEmergency(String emergencyId) async {
    return await callFunction('acceptEmergency', {'emergencyId': emergencyId});
  }

  static Future<Map<String, dynamic>> updateEmergencyStatus(String emergencyId, String status, [String? notes]) async {
    final data = {'emergencyId': emergencyId, 'status': status};
    if (notes != null) data['notes'] = notes;
    return await callFunction('updateEmergencyStatus', data);
  }

  static Future<Map<String, dynamic>> getUserEmergencies({String? status, int limit = 20}) async {
    final data = <String, dynamic>{'limit': limit};
    if (status != null) data['status'] = status;
    return await callFunction('getUserEmergencies', data);
  }

  static Future<Map<String, dynamic>> getProviderEmergencies({String? status, int limit = 20}) async {
    final data = <String, dynamic>{'limit': limit};
    if (status != null) data['status'] = status;
    return await callFunction('getProviderEmergencies', data);
  }

  static Future<Map<String, dynamic>> getEmergencyDetails(String emergencyId) async {
    return await callFunction('getEmergencyDetails', {'emergencyId': emergencyId});
  }

  static Future<Map<String, dynamic>> getNearbyEmergencies(Map<String, dynamic> location, [double radius = 15]) async {
    return await callFunction('getNearbyEmergencies', {'location': location, 'radius': radius});
  }

  // Payment Functions
  static Future<Map<String, dynamic>> getWalletBalance() async {
    return await callFunction('getWalletBalance');
  }

  static Future<Map<String, dynamic>> topUpWallet(double amount, String paymentMethodId) async {
    return await callFunction('topUpWallet', {'amount': amount, 'paymentMethodId': paymentMethodId});
  }

  static Future<Map<String, dynamic>> processBookingPayment(String bookingId, String paymentMethod, [String? paymentMethodId]) async {
    final data = {'bookingId': bookingId, 'paymentMethod': paymentMethod};
    if (paymentMethodId != null) data['paymentMethodId'] = paymentMethodId;
    return await callFunction('processBookingPayment', data);
  }

  static Future<Map<String, dynamic>> withdrawFromWallet(double amount, Map<String, dynamic> bankAccount) async {
    return await callFunction('withdrawFromWallet', {'amount': amount, 'bankAccount': bankAccount});
  }

  static Future<Map<String, dynamic>> getTransactionHistory({String? type, int limit = 20}) async {
    final data = <String, dynamic>{'limit': limit};
    if (type != null) data['type'] = type;
    return await callFunction('getTransactionHistory', data);
  }

  // Service Functions
  static Future<Map<String, dynamic>> getServices({String? category, bool isActive = true}) async {
    final data = <String, dynamic>{'isActive': isActive};
    if (category != null) data['category'] = category;
    return await callFunction('getServices', data);
  }

  static Future<Map<String, dynamic>> searchProviders({
    required Map<String, dynamic> location,
    String? category,
    double radius = 10,
    int limit = 20,
  }) async {
    return await callFunction('searchProviders', {
      'location': location,
      'category': category,
      'radius': radius,
      'limit': limit,
    });
  }

  // Utility Functions
  static Future<void> updateUserFCMToken(String token) async {
    final user = auth.currentUser;
    if (user != null) {
      await firestore.collection('users').doc(user.uid).update({
        'fcmToken': token,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
  }

  // File Upload
  static Future<String> uploadFile(String path, List<int> bytes, [String? fileName]) async {
    final ref = storage.ref().child(path).child(fileName ?? DateTime.now().millisecondsSinceEpoch.toString());
    final uploadTask = ref.putData(bytes);
    final snapshot = await uploadTask;
    return await snapshot.ref.getDownloadURL();
  }

  // Error Handling
  static Exception _handleFirebaseError(dynamic error) {
    if (error is FirebaseFunctionsException) {
      return Exception(error.message ?? 'Unknown Firebase Functions error');
    } else if (error is FirebaseAuthException) {
      return Exception(_getAuthErrorMessage(error.code));
    } else {
      return Exception(error.toString());
    }
  }

  static String _getAuthErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'No user found with this email address.';
      case 'wrong-password':
        return 'Incorrect password.';
      case 'email-already-in-use':
        return 'An account already exists with this email address.';
      case 'weak-password':
        return 'Password is too weak.';
      case 'invalid-email':
        return 'Invalid email address.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}