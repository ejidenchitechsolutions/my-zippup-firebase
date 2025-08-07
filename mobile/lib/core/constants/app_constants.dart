class AppConstants {
  // App Info
  static const String appName = 'ZippUp';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Multi-service on-demand platform';

  // API Endpoints
  static const String baseUrl = 'https://us-central1-zippup-backend.cloudfunctions.net';
  static const String apiVersion = 'v1';

  // Firebase Collections
  static const String usersCollection = 'users';
  static const String providersCollection = 'providers';
  static const String servicesCollection = 'services';
  static const String bookingsCollection = 'bookings';
  static const String emergenciesCollection = 'emergencies';
  static const String walletsCollection = 'wallets';
  static const String transactionsCollection = 'transactions';
  static const String reviewsCollection = 'reviews';
  static const String notificationsCollection = 'notifications';

  // Service Categories
  static const List<ServiceCategory> serviceCategories = [
    ServiceCategory(
      id: 'transport',
      name: 'Transport',
      icon: '🚗',
      color: 0xFF4CAF50,
      description: 'Rides, delivery, and transport services',
    ),
    ServiceCategory(
      id: 'emergency',
      name: 'Emergency',
      icon: '🚑',
      color: 0xFFE53E3E,
      description: 'Emergency medical, fire, and security services',
    ),
    ServiceCategory(
      id: 'personal_care',
      name: 'Personal Care',
      icon: '💇‍♀️',
      color: 0xFFE91E63,
      description: 'Beauty, wellness, and personal care services',
    ),
    ServiceCategory(
      id: 'tech_services',
      name: 'Tech Services',
      icon: '📱',
      color: 0xFF2196F3,
      description: 'Device repair and technical support',
    ),
    ServiceCategory(
      id: 'home_services',
      name: 'Home Services',
      icon: '🔧',
      color: 0xFF795548,
      description: 'Plumbing, electrical, cleaning, and repairs',
    ),
    ServiceCategory(
      id: 'construction',
      name: 'Construction',
      icon: '🏗️',
      color: 0xFFFF5722,
      description: 'Building, renovation, and construction work',
    ),
    ServiceCategory(
      id: 'digital_services',
      name: 'Digital Services',
      icon: '💳',
      color: 0xFF673AB7,
      description: 'Airtime, data, bills, and digital products',
    ),
  ];

  // Emergency Types
  static const List<EmergencyType> emergencyTypes = [
    EmergencyType(
      id: 'medical',
      name: 'Medical Emergency',
      icon: '🚑',
      color: 0xFFE53E3E,
      description: 'Medical assistance needed',
    ),
    EmergencyType(
      id: 'fire',
      name: 'Fire Emergency',
      icon: '🚒',
      color: 0xFFD32F2F,
      description: 'Fire emergency response',
    ),
    EmergencyType(
      id: 'police',
      name: 'Police',
      icon: '👮‍♂️',
      color: 0xFF1976D2,
      description: 'Police assistance needed',
    ),
    EmergencyType(
      id: 'roadside',
      name: 'Roadside Assistance',
      icon: '🛞',
      color: 0xFF607D8B,
      description: 'Vehicle breakdown or accident',
    ),
    EmergencyType(
      id: 'security',
      name: 'Security',
      icon: '🛡️',
      color: 0xFF424242,
      description: 'Security threat or incident',
    ),
  ];

  // App Settings
  static const int locationUpdateInterval = 5000; // milliseconds
  static const double defaultMapZoom = 15.0;
  static const int searchRadius = 10; // kilometers
  static const int maxProviderResults = 20;
  static const int emergencyRadius = 20; // kilometers for emergency dispatch

  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);

  // Validation
  static const int minPasswordLength = 6;
  static const int maxDescriptionLength = 500;
  static const int maxReviewLength = 300;

  // Payment
  static const double minTopUpAmount = 10.0;
  static const double maxTopUpAmount = 1000.0;
  static const double platformFeePercentage = 0.15; // 15%

  // Notification Types
  static const String notificationTypeBooking = 'booking';
  static const String notificationTypeEmergency = 'emergency';
  static const String notificationTypePayment = 'payment';
  static const String notificationTypePromotion = 'promotion';
  static const String notificationTypeSystem = 'system';
}

class ServiceCategory {
  final String id;
  final String name;
  final String icon;
  final int color;
  final String description;

  const ServiceCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.description,
  });
}

class EmergencyType {
  final String id;
  final String name;
  final String icon;
  final int color;
  final String description;

  const EmergencyType({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.description,
  });
}