import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Box, Paper, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { 
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

// Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Location {
  lat: number;
  lng: number;
}

interface MapMarker {
  id: string;
  position: Location;
  title: string;
  type: 'provider' | 'user' | 'emergency';
  info?: string;
}

interface MapComponentProps {
  center?: Location;
  zoom?: number;
  markers?: MapMarker[];
  onLocationSelect?: (location: Location) => void;
  height?: string | number;
  showControls?: boolean;
  interactive?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 12,
  markers = [],
  onLocationSelect,
  height = 400,
  showControls = true,
  interactive = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  // Load Google Maps API
  const loadGoogleMaps = useCallback(() => {
    if (window.google) {
      initializeMap();
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not found. Please check your environment variables.');
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key and internet connection.');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, []);

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: interactive ? 'auto' : 'none',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add click listener for location selection
      if (onLocationSelect && interactive) {
        map.addListener('click', (event: any) => {
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          onLocationSelect(location);
        });
      }

      setIsLoading(false);
    } catch (err) {
      setError('Failed to initialize Google Maps');
      setIsLoading(false);
    }
  }, [center, zoom, onLocationSelect, interactive]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: getMarkerIcon(markerData.type)
      });

      // Add info window if info provided
      if (markerData.info) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h6 style="margin: 0 0 4px 0; font-weight: bold;">${markerData.title}</h6>
              <p style="margin: 0; font-size: 14px;">${markerData.info}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  // Get marker icon based on type
  const getMarkerIcon = (type: string) => {
    const icons = {
      provider: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      },
      user: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#2196F3" stroke="#fff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">U</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      },
      emergency: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#F44336" stroke="#fff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">!</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      }
    };

    return icons[type as keyof typeof icons] || icons.provider;
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(15);
        }
      },
      (error) => {
        setError('Unable to get your location');
      }
    );
  };

  // Map control functions
  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
    }
  };

  const toggleFullscreen = () => {
    if (mapRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapRef.current.requestFullscreen();
      }
    }
  };

  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  if (error) {
    return (
      <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
      
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px'
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {showControls && !isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Tooltip title="My Location">
            <IconButton
              onClick={getCurrentLocation}
              sx={{
                backgroundColor: 'white',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'grey.100' }
              }}
              size="small"
            >
              <MyLocationIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom In">
            <IconButton
              onClick={zoomIn}
              sx={{
                backgroundColor: 'white',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'grey.100' }
              }}
              size="small"
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom Out">
            <IconButton
              onClick={zoomOut}
              sx={{
                backgroundColor: 'white',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'grey.100' }
              }}
              size="small"
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fullscreen">
            <IconButton
              onClick={toggleFullscreen}
              sx={{
                backgroundColor: 'white',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'grey.100' }
              }}
              size="small"
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default MapComponent;