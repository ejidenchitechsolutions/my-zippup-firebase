import { Timestamp, GeoPoint } from 'firebase-admin/firestore';

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Location interface
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  geohash: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

// User roles
export type UserRole = 'customer' | 'provider' | 'admin';

// User interface
export interface User extends BaseEntity {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string;
  location?: Location;
  isVerified: boolean;
  isActive: boolean;
  fcmToken?: string;
  preferences: {
    notifications: boolean;
    locationSharing: boolean;
    language: string;
  };
}

// Service categories
export type ServiceCategory = 
  | 'transport' 
  | 'emergency' 
  | 'personal_care' 
  | 'tech_services' 
  | 'construction' 
  | 'home_services'
  | 'digital_services';

// Service interface
export interface Service extends BaseEntity {
  name: string;
  description: string;
  category: ServiceCategory;
  icon: string;
  color: string;
  isActive: boolean;
  basePrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  estimatedDuration?: number; // in minutes
}

// Provider interface
export interface Provider extends BaseEntity {
  userId: string;
  serviceCategories: ServiceCategory[];
  businessName?: string;
  bio: string;
  location: Location;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  documents: {
    license?: string;
    insurance?: string;
    certification?: string;
  };
  availability: {
    [key: string]: { // day of week
      start: string;
      end: string;
      isAvailable: boolean;
    };
  };
  pricing: {
    [serviceId: string]: {
      basePrice: number;
      pricePerHour?: number;
      pricePerKm?: number;
    };
  };
}

// Booking status
export type BookingStatus = 
  | 'pending' 
  | 'accepted' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'rejected';

// Booking interface
export interface Booking extends BaseEntity {
  customerId: string;
  providerId?: string;
  serviceId: string;
  status: BookingStatus;
  location: Location;
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  description: string;
  isUrgent: boolean;
  estimatedPrice?: number;
  finalPrice?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  attachments?: string[];
  cancellationReason?: string;
}

// Marketplace item interface
export interface MarketplaceItem extends BaseEntity {
  vendorId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  isActive: boolean;
  location: Location;
  specifications?: { [key: string]: string };
  tags: string[];
}

// Digital service interface
export interface DigitalService extends BaseEntity {
  providerId: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  deliveryTime: number; // in hours
  isActive: boolean;
  category: 'airtime' | 'data' | 'bills' | 'digital_products';
  metadata: { [key: string]: any };
}

// Emergency types
export type EmergencyType = 
  | 'medical' 
  | 'fire' 
  | 'police' 
  | 'roadside' 
  | 'security' 
  | 'other';

// Emergency interface
export interface Emergency extends BaseEntity {
  userId: string;
  type: EmergencyType;
  location: Location;
  description: string;
  status: 'active' | 'responded' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedProviderId?: string;
  media?: string[];
  contacts: string[]; // emergency contacts
  responseTime?: number;
}

// Wallet interface
export interface Wallet extends BaseEntity {
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  pin?: string;
}

// Transaction types
export type TransactionType = 
  | 'payment' 
  | 'refund' 
  | 'topup' 
  | 'withdrawal' 
  | 'transfer';

// Transaction interface
export interface Transaction extends BaseEntity {
  userId: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  bookingId?: string;
  paymentMethod?: string;
  metadata?: { [key: string]: any };
}

// Review interface
export interface Review extends BaseEntity {
  customerId: string;
  providerId: string;
  bookingId: string;
  rating: number;
  comment: string;
  isVerified: boolean;
}

// Tracking interface
export interface Tracking extends BaseEntity {
  bookingId: string;
  customerId: string;
  providerId: string;
  currentLocation: Location;
  estimatedArrival?: Timestamp;
  status: 'en_route' | 'arrived' | 'in_progress' | 'completed';
}

// Notification interface
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'emergency' | 'promotion' | 'system';
  isRead: boolean;
  data?: { [key: string]: any };
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Search interfaces
export interface SearchQuery {
  query: string;
  category?: ServiceCategory;
  location?: Location;
  radius?: number; // in km
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: boolean;
}

export interface SearchResult {
  providers: Provider[];
  services: Service[];
  marketplaceItems: MarketplaceItem[];
  total: number;
  page: number;
  limit: number;
}