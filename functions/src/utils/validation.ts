import Joi from 'joi';
import { ServiceCategory, UserRole, BookingStatus, TransactionType, EmergencyType } from '../types';

// Common schemas
export const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  postalCode: Joi.string().optional(),
});

export const phoneSchema = Joi.string()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone number must be a valid international format',
  });

export const emailSchema = Joi.string().email().required();

// User validation schemas
export const createUserSchema = Joi.object({
  email: emailSchema,
  phone: phoneSchema,
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid(...Object.values(['customer', 'provider', 'admin'] as UserRole[])).required(),
  location: locationSchema.optional(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  location: locationSchema.optional(),
  preferences: Joi.object({
    notifications: Joi.boolean().optional(),
    locationSharing: Joi.boolean().optional(),
    language: Joi.string().optional(),
  }).optional(),
});

// Provider validation schemas
export const createProviderSchema = Joi.object({
  serviceCategories: Joi.array()
    .items(Joi.string().valid(...Object.values(['transport', 'emergency', 'personal_care', 'tech_services', 'construction', 'home_services', 'digital_services'] as ServiceCategory[])))
    .min(1)
    .required(),
  businessName: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).required(),
  location: locationSchema.required(),
});

export const updateProviderSchema = Joi.object({
  serviceCategories: Joi.array()
    .items(Joi.string().valid(...Object.values(['transport', 'emergency', 'personal_care', 'tech_services', 'construction', 'home_services', 'digital_services'] as ServiceCategory[])))
    .min(1)
    .optional(),
  businessName: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  location: locationSchema.optional(),
  isAvailable: Joi.boolean().optional(),
});

// Booking validation schemas
export const createBookingSchema = Joi.object({
  serviceId: Joi.string().required(),
  location: locationSchema.required(),
  scheduledAt: Joi.date().min('now').optional(),
  description: Joi.string().max(1000).required(),
  isUrgent: Joi.boolean().default(false),
  estimatedPrice: Joi.number().min(0).optional(),
});

export const updateBookingSchema = Joi.object({
  status: Joi.string().valid(...Object.values(['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'] as BookingStatus[])).optional(),
  providerId: Joi.string().optional(),
  finalPrice: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
  cancellationReason: Joi.string().max(200).optional(),
});

// Marketplace validation schemas
export const createMarketplaceItemSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  stock: Joi.number().min(0).required(),
  location: locationSchema.required(),
  specifications: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

// Digital service validation schemas
export const createDigitalServiceSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).required(),
  price: Joi.number().min(0).required(),
  duration: Joi.number().min(1).required(),
  deliveryTime: Joi.number().min(1).required(),
  category: Joi.string().valid('airtime', 'data', 'bills', 'digital_products').required(),
  metadata: Joi.object().optional(),
});

// Emergency validation schemas
export const createEmergencySchema = Joi.object({
  type: Joi.string().valid(...Object.values(['medical', 'fire', 'police', 'roadside', 'security', 'other'] as EmergencyType[])).required(),
  location: locationSchema.required(),
  description: Joi.string().max(500).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  contacts: Joi.array().items(phoneSchema).min(1).required(),
});

// Transaction validation schemas
export const createTransactionSchema = Joi.object({
  type: Joi.string().valid(...Object.values(['payment', 'refund', 'topup', 'withdrawal', 'transfer'] as TransactionType[])).required(),
  amount: Joi.number().min(0.01).required(),
  currency: Joi.string().length(3).default('USD'),
  description: Joi.string().max(200).required(),
  paymentMethod: Joi.string().optional(),
  bookingId: Joi.string().optional(),
});

// Review validation schemas
export const createReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(500).required(),
});

// Search validation schemas
export const searchSchema = Joi.object({
  query: Joi.string().min(2).max(100).required(),
  category: Joi.string().valid(...Object.values(['transport', 'emergency', 'personal_care', 'tech_services', 'construction', 'home_services', 'digital_services'] as ServiceCategory[])).optional(),
  location: locationSchema.optional(),
  radius: Joi.number().min(1).max(100).default(10),
  priceRange: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(Joi.ref('min')).required(),
  }).optional(),
  rating: Joi.number().min(1).max(5).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
});

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (data: any) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      throw new Error(`Validation error: ${JSON.stringify(errors)}`);
    }

    return value;
  };
};