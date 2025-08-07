import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  AccessTime as TimeIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import { useLocation } from '../hooks/useLocation';
import { EmergencyButton } from '../components/EmergencyButton';
import { ServiceCategoryCard } from '../components/ServiceCategoryCard';
import { NearbyProviders } from '../components/NearbyProviders';
import { PromotionsBanner } from '../components/PromotionsBanner';
import MapComponent from '../components/MapComponent';

// Mock data for demonstration
const mockProviders = [
  {
    id: '1',
    position: { lat: 40.7589, lng: -73.9851 },
    title: 'Mike\'s Plumbing',
    type: 'provider' as const,
    info: 'Available now • 4.8★ • $50-80/hr'
  },
  {
    id: '2', 
    position: { lat: 40.7505, lng: -73.9934 },
    title: 'Quick Fix Electric',
    type: 'provider' as const,
    info: 'Available now • 4.9★ • $60-90/hr'
  },
  {
    id: '3',
    position: { lat: 40.7614, lng: -73.9776 },
    title: 'Clean Pro Services',
    type: 'provider' as const,
    info: 'Busy until 3 PM • 4.7★ • $40-60/hr'
  },
  {
    id: '4',
    position: { lat: 40.7282, lng: -73.9942 },
    title: 'Tech Support Pro',
    type: 'provider' as const,
    info: 'Available now • 4.8★ • $70-100/hr'
  }
];

const quickStats = [
  { label: 'Active Providers', value: '1,234', color: '#4CAF50' },
  { label: 'Services Available', value: '50+', color: '#2196F3' },
  { label: 'Average Response', value: '< 15min', color: '#FF9800' },
  { label: 'Customer Rating', value: '4.9★', color: '#9C27B0' },
];

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { services, loading: servicesLoading } = useServices();
  const { location, loading: locationLoading } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleLocationSelect = (location: {lat: number, lng: number}) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <>
      <Helmet>
        <title>Home - ZippUp</title>
        <meta name="description" content="Find on-demand services, emergency support, and marketplace goods near you with ZippUp" />
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #6C5CE7, #A29BFE)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Welcome to ZippUp
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Your one-stop platform for on-demand services, emergency support, and marketplace goods
            </Typography>

            {/* Search Bar */}
            <Paper
              elevation={3}
              sx={{
                p: 2,
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
                borderRadius: 3,
              }}
            >
              <TextField
                fullWidth
                placeholder="Search for services, providers, or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button variant="contained" sx={{ borderRadius: 2 }}>
                        Search
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                  },
                }}
              />
            </Paper>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {quickStats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{ color: stat.color, mb: 1 }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Emergency Services Banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mb: 6,
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color: 'white',
              borderRadius: 3,
            }}
          >
            <Grid container alignItems="center" spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  🚨 Emergency Services Available 24/7
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                  Need immediate help? Our emergency response team is ready to assist you with urgent situations.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip label="Towing Services" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip label="Emergency Repairs" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip label="Medical Transport" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip label="Security Services" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <EmergencyButton />
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Service Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Popular Services
          </Typography>
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {services.slice(0, 8).map((service, index) => (
              <Grid item xs={6} sm={4} md={3} key={service.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ServiceCategoryCard service={service} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Promotions Banner */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PromotionsBanner />
        </motion.div>

        {/* Nearby Providers Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3, mt: 6 }}>
            🗺️ Nearby Service Providers
          </Typography>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Discover available service providers in your area. Click on markers to see details.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                  <Typography variant="body2">Available Providers</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#2196F3' }} />
                  <Typography variant="body2">Your Location</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#F44336' }} />
                  <Typography variant="body2">Emergency Services</Typography>
                </Box>
              </Box>
            </Box>
            
            <MapComponent
              center={location || { lat: 40.7128, lng: -74.0060 }}
              zoom={13}
              markers={mockProviders}
              onLocationSelect={handleLocationSelect}
              height={400}
              showControls={true}
              interactive={true}
            />
            
            {selectedLocation && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Location: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>

        {/* Nearby Providers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <NearbyProviders />
        </motion.div>
      </Container>
    </>
  );
};