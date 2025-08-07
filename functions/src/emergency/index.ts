import * as functions from 'firebase-functions';
import { db, collections, createDocument, updateDocument, getDocument, queryDocuments, sendNotification } from '../utils/firebase';
import { Emergency, Provider, User, Notification, ApiResponse } from '../types';
import { validateRequest, createEmergencySchema } from '../utils/validation';
import { getGeohashBounds, calculateDistance } from '../utils/geohash';
import { v4 as uuidv4 } from 'uuid';

// Create emergency report
export const createEmergency = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate input
    const validatedData = validateRequest(createEmergencySchema)(data);

    // Create emergency report
    const emergencyData: Omit<Emergency, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: context.auth.uid,
      type: validatedData.type,
      location: validatedData.location,
      description: validatedData.description,
      status: 'active',
      priority: validatedData.priority,
      contacts: validatedData.contacts,
      media: validatedData.media || [],
    };

    const emergencyId = uuidv4();
    const emergency = await createDocument<Emergency>(collections.emergencies, emergencyId, emergencyData);

    // Immediately dispatch to nearby emergency providers
    await dispatchEmergencyProviders(emergencyId, validatedData.type, validatedData.location, validatedData.priority);

    // Send notifications to emergency contacts
    await notifyEmergencyContacts(validatedData.contacts, validatedData.type, validatedData.location);

    const response: ApiResponse<Emergency> = {
      success: true,
      data: emergency as Emergency,
      message: 'Emergency report created. Dispatching to nearby providers...',
    };

    return response;
  } catch (error) {
    console.error('Error creating emergency:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Panic button - creates critical emergency
export const panicButton = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { location, description = 'Emergency assistance needed' } = data;

    if (!location) {
      throw new functions.https.HttpsError('invalid-argument', 'Location required');
    }

    // Get user emergency contacts
    const user = await getDocument<User>(collections.users, context.auth.uid);
    if (!user) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // Create critical emergency
    const emergencyData: Omit<Emergency, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: context.auth.uid,
      type: 'security', // Default panic button type
      location,
      description,
      status: 'active',
      priority: 'critical',
      contacts: [], // Will be populated from user profile or default contacts
    };

    const emergencyId = uuidv4();
    const emergency = await createDocument<Emergency>(collections.emergencies, emergencyId, emergencyData);

    // Dispatch to ALL nearby emergency providers (wider radius for panic)
    await dispatchEmergencyProviders(emergencyId, 'security', location, 'critical', 20); // 20km radius

    // Send SMS to emergency contacts if available
    if (user.phone) {
      await sendEmergencySMS(user.phone, location);
    }

    // Log panic button activation
    console.log(`PANIC BUTTON ACTIVATED - User: ${context.auth.uid}, Location: ${location.address}`);

    const response: ApiResponse<Emergency> = {
      success: true,
      data: emergency as Emergency,
      message: 'Panic button activated. Emergency services have been notified.',
    };

    return response;
  } catch (error) {
    console.error('Error activating panic button:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Dispatch emergency to nearby providers
const dispatchEmergencyProviders = async (
  emergencyId: string,
  emergencyType: string,
  location: any,
  priority: string,
  radiusKm: number = 15
) => {
  try {
    // Get geohash bounds for specified radius
    const bounds = getGeohashBounds([location.latitude, location.longitude], radiusKm);
    
    const nearbyProviders: Provider[] = [];

    // Query emergency service providers within geohash bounds
    for (const bound of bounds) {
      const providers = await queryDocuments<Provider>(
        collections.providers,
        [
          { field: 'serviceCategories', operator: 'array-contains', value: 'emergency' },
          { field: 'isAvailable', operator: '==', value: true },
          { field: 'isVerified', operator: '==', value: true },
          { field: 'location.geohash', operator: '>=', value: bound[0] },
          { field: 'location.geohash', operator: '<=', value: bound[1] },
        ]
      );
      
      nearbyProviders.push(...providers);
    }

    // Remove duplicates and filter by distance
    const uniqueProviders = nearbyProviders
      .filter((provider, index, self) => 
        self.findIndex(p => p.id === provider.id) === index
      )
      .filter(provider => 
        calculateDistance(location, provider.location) <= radiusKm
      )
      .sort((a, b) => {
        // Sort by distance, then by rating
        const distanceA = calculateDistance(location, a.location);
        const distanceB = calculateDistance(location, b.location);
        if (distanceA !== distanceB) return distanceA - distanceB;
        return b.rating - a.rating;
      });

    // Determine how many providers to notify based on priority
    const notifyCount = priority === 'critical' ? uniqueProviders.length : Math.min(6, uniqueProviders.length);
    const providersToNotify = uniqueProviders.slice(0, notifyCount);

    // Send emergency notifications to providers
    const notificationPromises = providersToNotify.map(async (provider) => {
      const user = await getDocument<User>(collections.users, provider.userId);
      if (user?.fcmToken) {
        const priorityEmojis = {
          low: '🟢',
          medium: '🟡',
          high: '🟠',
          critical: '🔴',
        };

        const emoji = priorityEmojis[priority as keyof typeof priorityEmojis] || '🚨';

        await sendNotification(
          user.fcmToken,
          {
            title: `${emoji} Emergency Dispatch - ${emergencyType.toUpperCase()}`,
            body: `${priority.toUpperCase()} priority emergency nearby. Tap to respond.`,
          },
          {
            emergencyId,
            type: 'emergency_dispatch',
            priority,
            emergencyType,
          }
        );

        // Create notification document
        const notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: provider.userId,
          title: `${emoji} Emergency Dispatch`,
          body: `${priority.toUpperCase()} priority ${emergencyType} emergency nearby`,
          type: 'emergency',
          isRead: false,
          data: { emergencyId, priority, emergencyType },
        };

        await createDocument<Notification>(collections.notifications, uuidv4(), notificationData);
      }
    });

    await Promise.all(notificationPromises);

    console.log(`Emergency ${emergencyId} dispatched to ${providersToNotify.length} providers`);
  } catch (error) {
    console.error('Error dispatching emergency providers:', error);
  }
};

// Send emergency SMS (placeholder - integrate with Twilio)
const sendEmergencySMS = async (phoneNumber: string, location: any) => {
  try {
    // This would integrate with Twilio or similar SMS service
    console.log(`Emergency SMS would be sent to ${phoneNumber} for location: ${location.address}`);
    
    // Example Twilio integration (uncomment and configure):
    /*
    const twilio = require('twilio');
    const client = twilio(functions.config().twilio.account_sid, functions.config().twilio.auth_token);
    
    await client.messages.create({
      body: `EMERGENCY ALERT: Emergency assistance has been requested at ${location.address}. Emergency services have been notified.`,
      from: functions.config().twilio.phone_number,
      to: phoneNumber,
    });
    */
  } catch (error) {
    console.error('Error sending emergency SMS:', error);
  }
};

// Notify emergency contacts
const notifyEmergencyContacts = async (contacts: string[], emergencyType: string, location: any) => {
  try {
    const message = `EMERGENCY ALERT: ${emergencyType.toUpperCase()} emergency reported at ${location.address}. Emergency services have been notified.`;
    
    // Send SMS to each contact
    for (const contact of contacts) {
      await sendEmergencySMS(contact, location);
    }
  } catch (error) {
    console.error('Error notifying emergency contacts:', error);
  }
};

// Accept emergency (provider)
export const acceptEmergency = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { emergencyId } = data;

    if (!emergencyId) {
      throw new functions.https.HttpsError('invalid-argument', 'Emergency ID required');
    }

    // Get emergency
    const emergency = await getDocument<Emergency>(collections.emergencies, emergencyId);
    if (!emergency) {
      throw new functions.https.HttpsError('not-found', 'Emergency not found');
    }

    if (emergency.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'Emergency is no longer active');
    }

    // Verify user is an emergency provider
    const providerQuery = await queryDocuments<Provider>(
      collections.providers,
      [
        { field: 'userId', operator: '==', value: context.auth.uid },
        { field: 'serviceCategories', operator: 'array-contains', value: 'emergency' },
      ]
    );

    if (providerQuery.length === 0) {
      throw new functions.https.HttpsError('permission-denied', 'Emergency provider profile required');
    }

    const provider = providerQuery[0];

    // Update emergency
    await updateDocument<Emergency>(collections.emergencies, emergencyId, {
      status: 'responded',
      assignedProviderId: provider.id,
      responseTime: Date.now() - emergency.createdAt.toMillis(),
    });

    // Notify the user who reported the emergency
    const user = await getDocument<User>(collections.users, emergency.userId);
    if (user?.fcmToken) {
      await sendNotification(
        user.fcmToken,
        {
          title: '🚑 Emergency Response',
          body: `Emergency services are responding to your ${emergency.type} emergency`,
        },
        {
          emergencyId,
          type: 'emergency_response',
        }
      );
    }

    const response: ApiResponse = {
      success: true,
      message: 'Emergency accepted. Proceeding to location.',
    };

    return response;
  } catch (error) {
    console.error('Error accepting emergency:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Update emergency status
export const updateEmergencyStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { emergencyId, status, notes } = data;

    if (!emergencyId || !status) {
      throw new functions.https.HttpsError('invalid-argument', 'Emergency ID and status required');
    }

    const validStatuses = ['active', 'responded', 'resolved', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid status');
    }

    // Get emergency
    const emergency = await getDocument<Emergency>(collections.emergencies, emergencyId);
    if (!emergency) {
      throw new functions.https.HttpsError('not-found', 'Emergency not found');
    }

    // Verify user has permission to update
    const isReporter = emergency.userId === context.auth.uid;
    const isAssignedProvider = emergency.assignedProviderId === context.auth.uid;
    const isAdmin = context.auth.token.role === 'admin';

    if (!isReporter && !isAssignedProvider && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Update emergency
    const updateData: any = { status };
    if (notes) {
      updateData.notes = notes;
    }

    await updateDocument<Emergency>(collections.emergencies, emergencyId, updateData);

    // Send notification to relevant parties
    const statusMessages: { [key: string]: string } = {
      resolved: 'Emergency has been resolved',
      cancelled: 'Emergency has been cancelled',
    };

    if (statusMessages[status]) {
      const otherUserId = isReporter ? emergency.assignedProviderId : emergency.userId;
      if (otherUserId) {
        const otherUser = await getDocument<User>(collections.users, otherUserId);
        if (otherUser?.fcmToken) {
          await sendNotification(
            otherUser.fcmToken,
            {
              title: 'Emergency Update',
              body: statusMessages[status],
            },
            {
              emergencyId,
              type: 'emergency_update',
              status,
            }
          );
        }
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Emergency status updated successfully',
    };

    return response;
  } catch (error) {
    console.error('Error updating emergency status:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get user emergencies
export const getUserEmergencies = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { status, limit = 20 } = data;

    const queries: any[] = [
      { field: 'userId', operator: '==', value: context.auth.uid },
    ];

    if (status) {
      queries.push({ field: 'status', operator: '==', value: status });
    }

    const emergencies = await queryDocuments<Emergency>(
      collections.emergencies,
      queries,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    const response: ApiResponse<Emergency[]> = {
      success: true,
      data: emergencies,
    };

    return response;
  } catch (error) {
    console.error('Error getting user emergencies:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get provider emergencies
export const getProviderEmergencies = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Get provider ID
    const providerQuery = await queryDocuments<Provider>(
      collections.providers,
      [{ field: 'userId', operator: '==', value: context.auth.uid }]
    );

    if (providerQuery.length === 0) {
      throw new functions.https.HttpsError('permission-denied', 'Emergency provider profile required');
    }

    const providerId = providerQuery[0].id;
    const { status, limit = 20 } = data;

    const queries: any[] = [
      { field: 'assignedProviderId', operator: '==', value: providerId },
    ];

    if (status) {
      queries.push({ field: 'status', operator: '==', value: status });
    }

    const emergencies = await queryDocuments<Emergency>(
      collections.emergencies,
      queries,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    const response: ApiResponse<Emergency[]> = {
      success: true,
      data: emergencies,
    };

    return response;
  } catch (error) {
    console.error('Error getting provider emergencies:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get emergency details
export const getEmergencyDetails = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { emergencyId } = data;

    if (!emergencyId) {
      throw new functions.https.HttpsError('invalid-argument', 'Emergency ID required');
    }

    const emergency = await getDocument<Emergency>(collections.emergencies, emergencyId);
    if (!emergency) {
      throw new functions.https.HttpsError('not-found', 'Emergency not found');
    }

    // Verify user has permission to view emergency
    const isReporter = emergency.userId === context.auth.uid;
    const isAssignedProvider = emergency.assignedProviderId === context.auth.uid;
    const isAdmin = context.auth.token.role === 'admin';

    if (!isReporter && !isAssignedProvider && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Get additional details
    let provider = null;
    let reporter = null;

    if (emergency.assignedProviderId) {
      provider = await getDocument<Provider>(collections.providers, emergency.assignedProviderId);
    }

    reporter = await getDocument<User>(collections.users, emergency.userId);

    const response: ApiResponse = {
      success: true,
      data: {
        emergency,
        provider,
        reporter,
      },
    };

    return response;
  } catch (error) {
    console.error('Error getting emergency details:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get nearby active emergencies (for emergency providers)
export const getNearbyEmergencies = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { location, radius = 15 } = data;

    if (!location) {
      throw new functions.https.HttpsError('invalid-argument', 'Location required');
    }

    // Verify user is an emergency provider
    const providerQuery = await queryDocuments<Provider>(
      collections.providers,
      [
        { field: 'userId', operator: '==', value: context.auth.uid },
        { field: 'serviceCategories', operator: 'array-contains', value: 'emergency' },
      ]
    );

    if (providerQuery.length === 0) {
      throw new functions.https.HttpsError('permission-denied', 'Emergency provider profile required');
    }

    // Get geohash bounds
    const bounds = getGeohashBounds([location.latitude, location.longitude], radius);
    
    const nearbyEmergencies: Emergency[] = [];

    // Query active emergencies within geohash bounds
    for (const bound of bounds) {
      const emergencies = await queryDocuments<Emergency>(
        collections.emergencies,
        [
          { field: 'status', operator: '==', value: 'active' },
          { field: 'location.geohash', operator: '>=', value: bound[0] },
          { field: 'location.geohash', operator: '<=', value: bound[1] },
        ]
      );
      
      nearbyEmergencies.push(...emergencies);
    }

    // Remove duplicates and filter by distance
    const uniqueEmergencies = nearbyEmergencies
      .filter((emergency, index, self) => 
        self.findIndex(e => e.id === emergency.id) === index
      )
      .filter(emergency => 
        calculateDistance(location, emergency.location) <= radius
      )
      .sort((a, b) => {
        // Sort by priority first, then by distance
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder];
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder];
        
        if (priorityA !== priorityB) return priorityA - priorityB;
        
        const distanceA = calculateDistance(location, a.location);
        const distanceB = calculateDistance(location, b.location);
        return distanceA - distanceB;
      });

    const response: ApiResponse<Emergency[]> = {
      success: true,
      data: uniqueEmergencies,
    };

    return response;
  } catch (error) {
    console.error('Error getting nearby emergencies:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});