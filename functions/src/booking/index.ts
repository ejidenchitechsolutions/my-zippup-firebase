import * as functions from 'firebase-functions';
import { db, collections, createDocument, updateDocument, getDocument, queryDocuments, sendNotification } from '../utils/firebase';
import { Booking, Provider, Service, User, Notification, ApiResponse } from '../types';
import { validateRequest, createBookingSchema, updateBookingSchema } from '../utils/validation';
import { getGeohashBounds, calculateDistance } from '../utils/geohash';
import { v4 as uuidv4 } from 'uuid';

// Create a new booking
export const createBooking = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate input
    const validatedData = validateRequest(createBookingSchema)(data);

    // Get service details
    const service = await getDocument<Service>(collections.services, validatedData.serviceId);
    if (!service || !service.isActive) {
      throw new functions.https.HttpsError('not-found', 'Service not found or inactive');
    }

    // Create booking
    const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
      customerId: context.auth.uid,
      serviceId: validatedData.serviceId,
      status: 'pending',
      location: validatedData.location,
      scheduledAt: validatedData.scheduledAt,
      description: validatedData.description,
      isUrgent: validatedData.isUrgent,
      estimatedPrice: validatedData.estimatedPrice,
      paymentStatus: 'pending',
    };

    const bookingId = uuidv4();
    const booking = await createDocument<Booking>(collections.bookings, bookingId, bookingData);

    // If urgent, immediately find and notify nearby providers
    if (validatedData.isUrgent) {
      await findAndNotifyProviders(bookingId, service.category, validatedData.location);
    }

    const response: ApiResponse<Booking> = {
      success: true,
      data: booking as Booking,
      message: validatedData.isUrgent 
        ? 'Urgent booking created. Notifying nearby providers...' 
        : 'Booking created successfully',
    };

    return response;
  } catch (error) {
    console.error('Error creating booking:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Find and notify nearby providers for urgent bookings
const findAndNotifyProviders = async (bookingId: string, serviceCategory: string, location: any) => {
  try {
    // Get geohash bounds for 10km radius
    const bounds = getGeohashBounds([location.latitude, location.longitude], 10);
    
    const nearbyProviders: Provider[] = [];

    // Query providers within geohash bounds
    for (const bound of bounds) {
      const providers = await queryDocuments<Provider>(
        collections.providers,
        [
          { field: 'serviceCategories', operator: 'array-contains', value: serviceCategory },
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
        calculateDistance(location, provider.location) <= 10
      )
      .sort((a, b) => {
        const distanceA = calculateDistance(location, a.location);
        const distanceB = calculateDistance(location, b.location);
        return distanceA - distanceB;
      })
      .slice(0, 4); // Notify up to 4 nearest providers

    // Send notifications to providers
    for (const provider of uniqueProviders) {
      const user = await getDocument<User>(collections.users, provider.userId);
      if (user?.fcmToken) {
        await sendNotification(
          user.fcmToken,
          {
            title: '🚨 Urgent Booking Request',
            body: `New urgent ${serviceCategory} request nearby`,
          },
          {
            bookingId,
            type: 'urgent_booking',
          }
        );

        // Create notification document
        const notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: provider.userId,
          title: '🚨 Urgent Booking Request',
          body: `New urgent ${serviceCategory} request nearby`,
          type: 'booking',
          isRead: false,
          data: { bookingId },
        };

        await createDocument<Notification>(collections.notifications, uuidv4(), notificationData);
      }
    }

    console.log(`Notified ${uniqueProviders.length} providers for urgent booking ${bookingId}`);
  } catch (error) {
    console.error('Error finding and notifying providers:', error);
  }
};

// Accept booking (provider)
export const acceptBooking = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingId } = data;

    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'Booking ID required');
    }

    // Get booking
    const booking = await getDocument<Booking>(collections.bookings, bookingId);
    if (!booking) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Booking is no longer available');
    }

    // Verify user is a provider
    const providerQuery = await queryDocuments<Provider>(
      collections.providers,
      [{ field: 'userId', operator: '==', value: context.auth.uid }]
    );

    if (providerQuery.length === 0) {
      throw new functions.https.HttpsError('permission-denied', 'Provider profile required');
    }

    const provider = providerQuery[0];

    // Update booking
    await updateDocument<Booking>(collections.bookings, bookingId, {
      status: 'accepted',
      providerId: provider.id,
    });

    // Notify customer
    const customer = await getDocument<User>(collections.users, booking.customerId);
    if (customer?.fcmToken) {
      await sendNotification(
        customer.fcmToken,
        {
          title: '✅ Booking Accepted',
          body: `Your booking has been accepted by ${provider.businessName || 'a provider'}`,
        },
        {
          bookingId,
          type: 'booking_accepted',
        }
      );
    }

    const response: ApiResponse = {
      success: true,
      message: 'Booking accepted successfully',
    };

    return response;
  } catch (error) {
    console.error('Error accepting booking:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Update booking status
export const updateBookingStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingId, status, notes } = data;

    if (!bookingId || !status) {
      throw new functions.https.HttpsError('invalid-argument', 'Booking ID and status required');
    }

    // Get booking
    const booking = await getDocument<Booking>(collections.bookings, bookingId);
    if (!booking) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    // Verify user has permission to update booking
    const isCustomer = booking.customerId === context.auth.uid;
    const isProvider = booking.providerId === context.auth.uid;
    const isAdmin = context.auth.token.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Validate status transition
    const validTransitions: { [key: string]: string[] } = {
      pending: ['accepted', 'cancelled', 'rejected'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      rejected: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid status transition');
    }

    // Update booking
    const updateData: any = { status };
    
    if (status === 'in_progress') {
      updateData.startedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    await updateDocument<Booking>(collections.bookings, bookingId, updateData);

    // Send notification to the other party
    const otherUserId = isCustomer ? booking.providerId : booking.customerId;
    if (otherUserId) {
      const otherUser = await getDocument<User>(collections.users, otherUserId);
      if (otherUser?.fcmToken) {
        const statusMessages: { [key: string]: string } = {
          accepted: 'Your booking has been accepted',
          in_progress: 'Your service has started',
          completed: 'Your service has been completed',
          cancelled: 'Your booking has been cancelled',
          rejected: 'Your booking has been rejected',
        };

        await sendNotification(
          otherUser.fcmToken,
          {
            title: 'Booking Update',
            body: statusMessages[status] || 'Booking status updated',
          },
          {
            bookingId,
            type: 'booking_update',
            status,
          }
        );
      }
    }

    // Update provider stats if completed
    if (status === 'completed' && booking.providerId) {
      const provider = await getDocument<Provider>(collections.providers, booking.providerId);
      if (provider) {
        await updateDocument<Provider>(collections.providers, booking.providerId, {
          completedJobs: provider.completedJobs + 1,
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Booking status updated successfully',
    };

    return response;
  } catch (error) {
    console.error('Error updating booking status:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get user bookings
export const getUserBookings = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { status, limit = 20 } = data;

    // Build query conditions
    const queries: any[] = [
      { field: 'customerId', operator: '==', value: context.auth.uid },
    ];

    if (status) {
      queries.push({ field: 'status', operator: '==', value: status });
    }

    const bookings = await queryDocuments<Booking>(
      collections.bookings,
      queries,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    const response: ApiResponse<Booking[]> = {
      success: true,
      data: bookings,
    };

    return response;
  } catch (error) {
    console.error('Error getting user bookings:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get provider bookings
export const getProviderBookings = functions.https.onCall(async (data, context) => {
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
      throw new functions.https.HttpsError('permission-denied', 'Provider profile required');
    }

    const providerId = providerQuery[0].id;
    const { status, limit = 20 } = data;

    // Build query conditions
    const queries: any[] = [
      { field: 'providerId', operator: '==', value: providerId },
    ];

    if (status) {
      queries.push({ field: 'status', operator: '==', value: status });
    }

    const bookings = await queryDocuments<Booking>(
      collections.bookings,
      queries,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    const response: ApiResponse<Booking[]> = {
      success: true,
      data: bookings,
    };

    return response;
  } catch (error) {
    console.error('Error getting provider bookings:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Get booking details
export const getBookingDetails = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingId } = data;

    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'Booking ID required');
    }

    const booking = await getDocument<Booking>(collections.bookings, bookingId);
    if (!booking) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    // Verify user has permission to view booking
    const isCustomer = booking.customerId === context.auth.uid;
    const isProvider = booking.providerId === context.auth.uid;
    const isAdmin = context.auth.token.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Get additional details
    const service = await getDocument<Service>(collections.services, booking.serviceId);
    let provider = null;
    let customer = null;

    if (booking.providerId) {
      provider = await getDocument<Provider>(collections.providers, booking.providerId);
    }

    customer = await getDocument<User>(collections.users, booking.customerId);

    const response: ApiResponse = {
      success: true,
      data: {
        booking,
        service,
        provider,
        customer,
      },
    };

    return response;
  } catch (error) {
    console.error('Error getting booking details:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});

// Cancel booking
export const cancelBooking = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingId, reason } = data;

    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'Booking ID required');
    }

    const booking = await getDocument<Booking>(collections.bookings, bookingId);
    if (!booking) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    // Verify user can cancel booking
    const isCustomer = booking.customerId === context.auth.uid;
    const isProvider = booking.providerId === context.auth.uid;

    if (!isCustomer && !isProvider) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Check if booking can be cancelled
    if (!['pending', 'accepted'].includes(booking.status)) {
      throw new functions.https.HttpsError('failed-precondition', 'Booking cannot be cancelled');
    }

    // Update booking
    await updateDocument<Booking>(collections.bookings, bookingId, {
      status: 'cancelled',
      cancellationReason: reason,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Booking cancelled successfully',
    };

    return response;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return response;
  }
});