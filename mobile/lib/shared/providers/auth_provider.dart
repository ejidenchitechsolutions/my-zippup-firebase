import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/services/firebase_service.dart';

// Auth state provider
final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseService.auth.authStateChanges();
});

// Current user provider
final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.when(
    data: (user) => user,
    loading: () => null,
    error: (_, __) => null,
  );
});

// Auth methods provider
final authProvider = Provider((ref) => AuthMethods());

class AuthMethods {
  Future<UserCredential?> signInWithEmail(String email, String password) async {
    try {
      return await FirebaseService.signInWithEmail(email, password);
    } catch (e) {
      rethrow;
    }
  }

  Future<UserCredential?> createUserWithEmail(String email, String password) async {
    try {
      return await FirebaseService.createUserWithEmail(email, password);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await FirebaseService.signOut();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await FirebaseService.sendPasswordResetEmail(email);
    } catch (e) {
      rethrow;
    }
  }
}