import * as functions from 'firebase-functions';

// Import all function modules
import * as authFunctions from './auth';
import * as bookingFunctions from './booking';
import * as paymentFunctions from './payment';
import * as emergencyFunctions from './emergency';

// Export authentication functions
export const onUserCreate = authFunctions.onUserCreate;
export const onUserDelete = authFunctions.onUserDelete;
export const getUserProfile = authFunctions.getUserProfile;
export const updateUserProfile = authFunctions.updateUserProfile;
export const becomeProvider = authFunctions.becomeProvider;
export const getProviderProfile = authFunctions.getProviderProfile;
export const updateProviderProfile = authFunctions.updateProviderProfile;
export const verifyProvider = authFunctions.verifyProvider;
export const uploadProfileImage = authFunctions.uploadProfileImage;

// Export booking functions
export const createBooking = bookingFunctions.createBooking;
export const acceptBooking = bookingFunctions.acceptBooking;
export const updateBookingStatus = bookingFunctions.updateBookingStatus;
export const getUserBookings = bookingFunctions.getUserBookings;
export const getProviderBookings = bookingFunctions.getProviderBookings;
export const getBookingDetails = bookingFunctions.getBookingDetails;
export const cancelBooking = bookingFunctions.cancelBooking;

// Export payment functions
export const createWallet = paymentFunctions.createWallet;
export const getWalletBalance = paymentFunctions.getWalletBalance;
export const topUpWallet = paymentFunctions.topUpWallet;
export const processBookingPayment = paymentFunctions.processBookingPayment;
export const transferToProvider = paymentFunctions.transferToProvider;
export const withdrawFromWallet = paymentFunctions.withdrawFromWallet;
export const getTransactionHistory = paymentFunctions.getTransactionHistory;
export const stripeWebhook = paymentFunctions.stripeWebhook;

// Export emergency functions
export const createEmergency = emergencyFunctions.createEmergency;
export const panicButton = emergencyFunctions.panicButton;
export const acceptEmergency = emergencyFunctions.acceptEmergency;
export const updateEmergencyStatus = emergencyFunctions.updateEmergencyStatus;
export const getUserEmergencies = emergencyFunctions.getUserEmergencies;
export const getProviderEmergencies = emergencyFunctions.getProviderEmergencies;
export const getEmergencyDetails = emergencyFunctions.getEmergencyDetails;
export const getNearbyEmergencies = emergencyFunctions.getNearbyEmergencies;

// Utility functions
export const initializeServices = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { db, collections, createDocument } = await import('./utils/firebase');
    const { Service } = await import('./types');

    // Default services to initialize
    const defaultServices = [
      {
        name: 'Ride Sharing',
        description: 'Book rides with verified drivers',
        category: 'transport',
        icon: '🚗',
        color: '#4CAF50',
        isActive: true,
        basePrice: 5,
        priceRange: { min: 5, max: 50 },
        estimatedDuration: 30,
      },
      {
        name: 'Food Delivery',
        description: 'Get food delivered from local restaurants',
        category: 'transport',
        icon: '🍔',
        color: '#FF9800',
        isActive: true,
        basePrice: 3,
        priceRange: { min: 3, max: 15 },
        estimatedDuration: 45,
      },
      {
        name: 'Emergency Medical',
        description: 'Immediate medical assistance',
        category: 'emergency',
        icon: '🚑',
        color: '#F44336',
        isActive: true,
        basePrice: 100,
        priceRange: { min: 100, max: 500 },
        estimatedDuration: 15,
      },
      {
        name: 'Fire Emergency',
        description: 'Fire emergency response',
        category: 'emergency',
        icon: '🚒',
        color: '#D32F2F',
        isActive: true,
        basePrice: 0,
        priceRange: { min: 0, max: 0 },
        estimatedDuration: 10,
      },
      {
        name: 'Roadside Assistance',
        description: 'Car breakdown and towing services',
        category: 'emergency',
        icon: '🛞',
        color: '#607D8B',
        isActive: true,
        basePrice: 50,
        priceRange: { min: 50, max: 200 },
        estimatedDuration: 30,
      },
      {
        name: 'Hair & Beauty',
        description: 'Professional hair and beauty services',
        category: 'personal_care',
        icon: '💇‍♀️',
        color: '#E91E63',
        isActive: true,
        basePrice: 30,
        priceRange: { min: 30, max: 150 },
        estimatedDuration: 90,
      },
      {
        name: 'Massage Therapy',
        description: 'Relaxing massage services at your location',
        category: 'personal_care',
        icon: '💆‍♀️',
        color: '#9C27B0',
        isActive: true,
        basePrice: 60,
        priceRange: { min: 60, max: 200 },
        estimatedDuration: 60,
      },
      {
        name: 'Phone Repair',
        description: 'Mobile phone and tablet repair services',
        category: 'tech_services',
        icon: '📱',
        color: '#2196F3',
        isActive: true,
        basePrice: 50,
        priceRange: { min: 50, max: 300 },
        estimatedDuration: 120,
      },
      {
        name: 'Computer Repair',
        description: 'Computer and laptop repair services',
        category: 'tech_services',
        icon: '💻',
        color: '#3F51B5',
        isActive: true,
        basePrice: 80,
        priceRange: { min: 80, max: 400 },
        estimatedDuration: 180,
      },
      {
        name: 'Plumbing',
        description: 'Professional plumbing services',
        category: 'home_services',
        icon: '🔧',
        color: '#795548',
        isActive: true,
        basePrice: 100,
        priceRange: { min: 100, max: 500 },
        estimatedDuration: 120,
      },
      {
        name: 'Electrical Work',
        description: 'Licensed electrical services',
        category: 'home_services',
        icon: '⚡',
        color: '#FFC107',
        isActive: true,
        basePrice: 120,
        priceRange: { min: 120, max: 600 },
        estimatedDuration: 150,
      },
      {
        name: 'House Cleaning',
        description: 'Professional house cleaning services',
        category: 'home_services',
        icon: '🧽',
        color: '#00BCD4',
        isActive: true,
        basePrice: 80,
        priceRange: { min: 80, max: 250 },
        estimatedDuration: 180,
      },
      {
        name: 'Construction',
        description: 'Building and renovation services',
        category: 'construction',
        icon: '🏗️',
        color: '#FF5722',
        isActive: true,
        basePrice: 200,
        priceRange: { min: 200, max: 2000 },
        estimatedDuration: 480,
      },
      {
        name: 'Carpentry',
        description: 'Custom woodwork and furniture repair',
        category: 'construction',
        icon: '🪚',
        color: '#8BC34A',
        isActive: true,
        basePrice: 150,
        priceRange: { min: 150, max: 800 },
        estimatedDuration: 240,
      },
      {
        name: 'Mobile Airtime',
        description: 'Top up your mobile phone credit',
        category: 'digital_services',
        icon: '📞',
        color: '#009688',
        isActive: true,
        basePrice: 0,
        priceRange: { min: 5, max: 100 },
        estimatedDuration: 1,
      },
      {
        name: 'Internet Data',
        description: 'Purchase mobile data packages',
        category: 'digital_services',
        icon: '📶',
        color: '#4CAF50',
        isActive: true,
        basePrice: 0,
        priceRange: { min: 10, max: 200 },
        estimatedDuration: 1,
      },
      {
        name: 'Bill Payment',
        description: 'Pay utility bills and subscriptions',
        category: 'digital_services',
        icon: '💳',
        color: '#673AB7',
        isActive: true,
        basePrice: 0,
        priceRange: { min: 20, max: 1000 },
        estimatedDuration: 1,
      },
    ];

    const { v4: uuidv4 } = await import('uuid');

    // Create services
    const promises = defaultServices.map(async (serviceData) => {
      const serviceId = uuidv4();
      return createDocument<Service>(collections.services, serviceId, serviceData);
    });

    await Promise.all(promises);

    return {
      success: true,
      message: `${defaultServices.length} services initialized successfully`,
    };
  } catch (error) {
    console.error('Error initializing services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get all services
export const getServices = functions.https.onCall(async (data, context) => {
  try {
    const { queryDocuments, collections } = await import('./utils/firebase');
    const { Service, ApiResponse } = await import('./types');

    const { category, isActive = true } = data;

    const queries: any[] = [
      { field: 'isActive', operator: '==', value: isActive },
    ];

    if (category) {
      queries.push({ field: 'category', operator: '==', value: category });
    }

    const services = await queryDocuments<Service>(
      collections.services,
      queries,
      { field: 'name', direction: 'asc' }
    );

    const response: ApiResponse<Service[]> = {
      success: true,
      data: services,
    };

    return response;
  } catch (error) {
    console.error('Error getting services:', error);
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Search providers
export const searchProviders = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { queryDocuments, collections } = await import('./utils/firebase');
    const { getGeohashBounds, calculateDistance } = await import('./utils/geohash');
    const { Provider, ApiResponse } = await import('./types');

    const { location, category, radius = 10, limit = 20 } = data;

    if (!location) {
      throw new functions.https.HttpsError('invalid-argument', 'Location required');
    }

    // Get geohash bounds
    const bounds = getGeohashBounds([location.latitude, location.longitude], radius);
    
    const nearbyProviders: Provider[] = [];

    // Query providers within geohash bounds
    for (const bound of bounds) {
      const queries: any[] = [
        { field: 'isAvailable', operator: '==', value: true },
        { field: 'isVerified', operator: '==', value: true },
        { field: 'location.geohash', operator: '>=', value: bound[0] },
        { field: 'location.geohash', operator: '<=', value: bound[1] },
      ];

      if (category) {
        queries.push({ field: 'serviceCategories', operator: 'array-contains', value: category });
      }

      const providers = await queryDocuments<Provider>(
        collections.providers,
        queries
      );
      
      nearbyProviders.push(...providers);
    }

    // Remove duplicates and filter by distance
    const uniqueProviders = nearbyProviders
      .filter((provider, index, self) => 
        self.findIndex(p => p.id === provider.id) === index
      )
      .filter(provider => 
        calculateDistance(location, provider.location) <= radius
      )
      .sort((a, b) => {
        // Sort by rating first, then by distance
        if (a.rating !== b.rating) return b.rating - a.rating;
        
        const distanceA = calculateDistance(location, a.location);
        const distanceB = calculateDistance(location, b.location);
        return distanceA - distanceB;
      })
      .slice(0, limit);

    const response: ApiResponse<Provider[]> = {
      success: true,
      data: uniqueProviders,
    };

    return response;
  } catch (error) {
    console.error('Error searching providers:', error);
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Health check endpoint
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      auth: 'operational',
      booking: 'operational',
      payment: 'operational',
      emergency: 'operational',
    },
  });
});