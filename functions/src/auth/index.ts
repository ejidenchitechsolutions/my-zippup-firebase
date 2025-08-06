import * as functions from 'firebase-functions';
import { auth, db, collections, createDocument, updateDocument, getDocument, setCustomClaims } from '../utils/firebase';
import { User, Provider, Wallet, ApiResponse } from '../types';
import { validateRequest, createUserSchema, updateUserSchema, createProviderSchema } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';

// User registration trigger
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      email: user.email || '',
      phone: user.phoneNumber || '',
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ')[1] || '',
      role: 'customer',
      isVerified: user.emailVerified,
      isActive: true,
      preferences: {
        notifications: true,
        locationSharing: true,
        language: 'en',
      },
    };

    // Create user document
    await createDocument<User>(collections.users, user.uid, userData);

    // Set custom claims
    await setCustomClaims(user.uid, { role: 'customer' });

    // Create wallet for user
    const walletData: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.uid,
      balance: 0,
      currency: 'USD',
      isActive: true,
    };

    await createDocument<Wallet>(collections.wallets, uuidv4(), walletData);

    console.log(`User ${user.uid} created successfully`);
  } catch (error) {
    console.error('Error creating user:', error);
  }
});

// User deletion trigger
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user document
    await db.collection(collections.users).doc(user.uid).delete();
    
    // Delete associated provider profile if exists
    const providerQuery = await db
      .collection(collections.providers)
      .where('userId', '==', user.uid)
      .get();
    
    if (!providerQuery.empty) {
      const batch = db.batch();
      providerQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Delete wallet
    const walletQuery = await db
      .collection(collections.wallets)
      .where('userId', '==', user.uid)
      .get();
    
    if (!walletQuery.empty) {
      const batch = db.batch();
      walletQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    console.log(`User ${user.uid} and associated data deleted successfully`);
  } catch (error) {
    console.error('Error deleting user data:', error);
  }
});

// Get user profile
export const getUserProfile = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = data.userId || context.auth.uid;
    
    // Only allow users to get their own profile or admin to get any profile
    if (userId !== context.auth.uid && context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    const user = await getDocument<User>(collections.users, userId);
    if (!user) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    return response;
  } catch (error) {
    console.error('Error getting user profile:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Update user profile
export const updateUserProfile = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate input
    const validatedData = validateRequest(updateUserSchema)(data);

    await updateDocument<User>(collections.users, context.auth.uid, validatedData);

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
    };

    return response;
  } catch (error) {
    console.error('Error updating user profile:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Become a service provider
export const becomeProvider = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate input
    const validatedData = validateRequest(createProviderSchema)(data);

    // Check if user already has a provider profile
    const existingProvider = await db
      .collection(collections.providers)
      .where('userId', '==', context.auth.uid)
      .get();

    if (!existingProvider.empty) {
      throw new functions.https.HttpsError('already-exists', 'Provider profile already exists');
    }

    // Create provider profile
    const providerData: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: context.auth.uid,
      serviceCategories: validatedData.serviceCategories,
      businessName: validatedData.businessName,
      bio: validatedData.bio,
      location: validatedData.location,
      isAvailable: false, // Requires admin approval
      isVerified: false,
      rating: 0,
      totalReviews: 0,
      completedJobs: 0,
      documents: {},
      availability: {},
      pricing: {},
    };

    const providerId = uuidv4();
    await createDocument<Provider>(collections.providers, providerId, providerData);

    // Update user role
    await updateDocument<User>(collections.users, context.auth.uid, { role: 'provider' });
    await setCustomClaims(context.auth.uid, { role: 'provider' });

    const response: ApiResponse = {
      success: true,
      message: 'Provider profile created successfully. Awaiting verification.',
      data: { providerId },
    };

    return response;
  } catch (error) {
    console.error('Error creating provider profile:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get provider profile
export const getProviderProfile = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = data.userId || context.auth.uid;

    const providerQuery = await db
      .collection(collections.providers)
      .where('userId', '==', userId)
      .get();

    if (providerQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Provider profile not found');
    }

    const provider = providerQuery.docs[0].data() as Provider;

    const response: ApiResponse<Provider> = {
      success: true,
      data: provider,
    };

    return response;
  } catch (error) {
    console.error('Error getting provider profile:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Update provider profile
export const updateProviderProfile = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Get provider document
    const providerQuery = await db
      .collection(collections.providers)
      .where('userId', '==', context.auth.uid)
      .get();

    if (providerQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Provider profile not found');
    }

    const providerId = providerQuery.docs[0].id;

    // Validate input
    const validatedData = validateRequest(updateProviderSchema)(data);

    await updateDocument<Provider>(collections.providers, providerId, validatedData);

    const response: ApiResponse = {
      success: true,
      message: 'Provider profile updated successfully',
    };

    return response;
  } catch (error) {
    console.error('Error updating provider profile:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Verify provider (admin only)
export const verifyProvider = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { providerId, isVerified } = data;

    if (!providerId || typeof isVerified !== 'boolean') {
      throw new functions.https.HttpsError('invalid-argument', 'Provider ID and verification status required');
    }

    await updateDocument<Provider>(collections.providers, providerId, {
      isVerified,
      isAvailable: isVerified, // Auto-enable when verified
    });

    const response: ApiResponse = {
      success: true,
      message: `Provider ${isVerified ? 'verified' : 'unverified'} successfully`,
    };

    return response;
  } catch (error) {
    console.error('Error verifying provider:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Upload profile image
export const uploadProfileImage = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { imageUrl } = data;

    if (!imageUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Image URL required');
    }

    await updateDocument<User>(collections.users, context.auth.uid, {
      profileImage: imageUrl,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Profile image updated successfully',
    };

    return response;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});