import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Emergency as EmergencyIcon,
  LocationOn as LocationIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import { useLocation } from '../hooks/useLocation';
import { EmergencyButton } from '../components/EmergencyButton';
import { ServiceCategoryCard } from '../components/ServiceCategoryCard';
import { NearbyProviders } from '../components/NearbyProviders';
import { PromotionsBanner } from '../components/PromotionsBanner';

const serviceCategories = [
  {
    id: 'transport',
    name: 'Transport',
    icon: '🚗',
    color: '#4CAF50',
    description: 'Rides, delivery, and transport services',
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: '🚑',
    color: '#E53E3E',
    description: 'Emergency medical, fire, and security services',
  },
  {
    id: 'personal_care',
    name: 'Personal Care',
    icon: '💇‍♀️',
    color: '#E91E63',
    description: 'Beauty, wellness, and personal care services',
  },
  {
    id: 'tech_services',
    name: 'Tech Services',
    icon: '📱',
    color: '#2196F3',
    description: 'Device repair and technical support',
  },
  {
    id: 'home_services',
    name: 'Home Services',
    icon: '🔧',
    color: '#795548',
    description: 'Plumbing, electrical, cleaning, and repairs',
  },
  {
    id: 'construction',
    name: 'Construction',
    icon: '🏗️',
    color: '#FF5722',
    description: 'Building, renovation, and construction work',
  },
  {
    id: 'digital_services',
    name: 'Digital Services',
    icon: '💳',
    color: '#673AB7',
    description: 'Airtime, data, bills, and digital products',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { location, isLoading: locationLoading } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/services/${categoryId}`);
  };

  return (
    <>
      <Helmet>
        <title>ZippUp - Multi-Service Platform</title>
        <meta name="description" content="Access transport, emergency, home services, and more with ZippUp" />
      </Helmet>

      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
            color: 'white',
            py: { xs: 4, md: 6 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                    {getGreeting()}, {user?.firstName || 'User'}!
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
                    {locationLoading ? (
                      'Getting your location...'
                    ) : location ? (
                      `📍 ${location.address}`
                    ) : (
                      'Location not available'
                    )}
                  </Typography>

                  {/* Search Bar */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      placeholder="Search for services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 3,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'white',
                          },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Quick Stats */}
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold">
                          24/7
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Available
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold">
                          500+
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Providers
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold">
                          15min
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Avg Response
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold">
                          4.8★
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Rating
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      Need immediate help?
                    </Typography>
                    <EmergencyButton size="large" />
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Emergency Services Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, #E53E3E 0%, #C53030 100%)',
                color: 'white',
                mb: 4,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
                      <EmergencyIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Emergency Services Available
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Medical, Fire, Police, Roadside assistance - Available 24/7
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                      }}
                      onClick={() => navigate('/emergency')}
                    >
                      Learn More
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
              Our Services
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Choose from a wide range of services available in your area
            </Typography>

            <Grid container spacing={3}>
              {serviceCategories.map((category, index) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <ServiceCategoryCard
                      category={category}
                      onClick={() => handleCategoryClick(category.id)}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Promotions Banner */}
          <Box sx={{ my: 6 }}>
            <PromotionsBanner />
          </Box>

          {/* Nearby Providers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <NearbyProviders />
          </motion.div>

          {/* Features Section */}
          <Box sx={{ mt: 8 }}>
            <Typography variant="h4" component="h2" textAlign="center" gutterBottom fontWeight="bold">
              Why Choose ZippUp?
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <LocationIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Real-time Tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track your service provider in real-time with accurate ETA updates
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <WalletIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Secure Payments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay securely with our integrated wallet or card payments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'warning.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <NotificationsIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Instant Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stay updated with real-time notifications about your bookings
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </>
  );
};