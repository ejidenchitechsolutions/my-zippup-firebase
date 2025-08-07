<template>
  <div class="map-container">
    <v-card class="map-card" elevation="3">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-map</v-icon>
        {{ title }}
        <v-spacer></v-spacer>
        <v-chip-group v-if="showLegend" class="me-2">
          <v-chip
            v-for="legend in mapLegend"
            :key="legend.type"
            :color="legend.color"
            size="small"
            variant="outlined"
          >
            <v-icon start :icon="legend.icon"></v-icon>
            {{ legend.label }}
          </v-chip>
        </v-chip-group>
        <v-btn-group variant="outlined" density="compact">
          <v-btn @click="getCurrentLocation" :loading="locationLoading">
            <v-icon>mdi-crosshairs-gps</v-icon>
          </v-btn>
          <v-btn @click="refreshMap">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn @click="toggleFullscreen">
            <v-icon>mdi-fullscreen</v-icon>
          </v-btn>
        </v-btn-group>
      </v-card-title>

      <v-divider></v-divider>

      <div class="map-wrapper" :style="{ height: mapHeight + 'px' }">
        <div
          ref="mapContainer"
          class="google-map"
          :style="{ width: '100%', height: '100%' }"
        ></div>

        <!-- Loading Overlay -->
        <v-overlay
          :model-value="loading"
          contained
          class="d-flex align-center justify-center"
        >
          <v-progress-circular
            indeterminate
            size="64"
            color="primary"
          ></v-progress-circular>
        </v-overlay>

        <!-- Error State -->
        <v-alert
          v-if="error"
          type="error"
          class="ma-4"
          :text="error"
          closable
          @click:close="error = null"
        ></v-alert>

        <!-- Map Controls -->
        <div v-if="showControls && !loading" class="map-controls">
          <v-btn-group vertical density="compact">
            <v-btn size="small" @click="zoomIn">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn size="small" @click="zoomOut">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </v-btn-group>
        </div>
      </div>

      <!-- Map Stats -->
      <v-card-text v-if="showStats">
        <v-row>
          <v-col cols="3">
            <v-card variant="outlined">
              <v-card-text class="text-center">
                <div class="text-h6 text-success">{{ stats.activeProviders }}</div>
                <div class="text-caption">Active Providers</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="3">
            <v-card variant="outlined">
              <v-card-text class="text-center">
                <div class="text-h6 text-primary">{{ stats.activeBookings }}</div>
                <div class="text-caption">Active Bookings</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="3">
            <v-card variant="outlined">
              <v-card-text class="text-center">
                <div class="text-h6 text-warning">{{ stats.emergencies }}</div>
                <div class="text-caption">Emergencies</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="3">
            <v-card variant="outlined">
              <v-card-text class="text-center">
                <div class="text-h6 text-info">{{ stats.avgResponseTime }}</div>
                <div class="text-caption">Avg Response</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

interface MapMarker {
  id: string
  position: { lat: number; lng: number }
  title: string
  type: 'provider' | 'user' | 'emergency' | 'booking'
  info?: string
  status?: string
}

interface MapProps {
  title?: string
  markers?: MapMarker[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: number
  showControls?: boolean
  showLegend?: boolean
  showStats?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<MapProps>(), {
  title: 'Map View',
  markers: () => [],
  center: () => ({ lat: 40.7128, lng: -74.0060 }),
  zoom: 12,
  height: 400,
  showControls: true,
  showLegend: true,
  showStats: false,
  interactive: true
})

const emit = defineEmits<{
  markerClick: [marker: MapMarker]
  locationSelect: [location: { lat: number; lng: number }]
}>()

// Reactive data
const mapContainer = ref<HTMLElement>()
const loading = ref(true)
const error = ref<string | null>(null)
const locationLoading = ref(false)
const map = ref<any>(null)
const markers = ref<any[]>([])

// Computed properties
const mapHeight = computed(() => props.height)

const mapLegend = [
  { type: 'provider', label: 'Providers', color: 'success', icon: 'mdi-account-hard-hat' },
  { type: 'user', label: 'Users', color: 'primary', icon: 'mdi-account' },
  { type: 'emergency', label: 'Emergency', color: 'error', icon: 'mdi-alert' },
  { type: 'booking', label: 'Bookings', color: 'warning', icon: 'mdi-bookmark' }
]

const stats = ref({
  activeProviders: 156,
  activeBookings: 23,
  emergencies: 2,
  avgResponseTime: '12min'
})

// Google Maps API loading
const loadGoogleMaps = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.google) {
      resolve()
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      reject(new Error('Google Maps API key not found'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))

    document.head.appendChild(script)
  })
}

// Initialize map
const initializeMap = async () => {
  if (!mapContainer.value) return

  try {
    loading.value = true
    await loadGoogleMaps()

    map.value = new window.google.maps.Map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      gestureHandling: props.interactive ? 'auto' : 'none',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Add click listener
    if (props.interactive) {
      map.value.addListener('click', (event: any) => {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }
        emit('locationSelect', location)
      })
    }

    loading.value = false
    updateMarkers()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to initialize map'
    loading.value = false
  }
}

// Update markers on map
const updateMarkers = () => {
  if (!map.value) return

  // Clear existing markers
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []

  // Add new markers
  props.markers.forEach(markerData => {
    const marker = new window.google.maps.Marker({
      position: markerData.position,
      map: map.value,
      title: markerData.title,
      icon: getMarkerIcon(markerData.type, markerData.status)
    })

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: createInfoWindowContent(markerData)
    })

    marker.addListener('click', () => {
      infoWindow.open(map.value, marker)
      emit('markerClick', markerData)
    })

    markers.value.push(marker)
  })
}

// Get marker icon based on type and status
const getMarkerIcon = (type: string, status?: string) => {
  const colors = {
    provider: status === 'available' ? '#4CAF50' : '#FFC107',
    user: '#2196F3',
    emergency: '#F44336',
    booking: '#FF9800'
  }

  const icons = {
    provider: 'P',
    user: 'U',
    emergency: '!',
    booking: 'B'
  }

  const color = colors[type as keyof typeof colors] || '#757575'
  const icon = icons[type as keyof typeof icons] || '?'

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="#fff" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${icon}</text>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(32, 32)
  }
}

// Create info window content
const createInfoWindowContent = (markerData: MapMarker) => {
  return `
    <div style="padding: 12px; min-width: 200px;">
      <h6 style="margin: 0 0 8px 0; font-weight: bold; color: #1976d2;">
        ${markerData.title}
      </h6>
      <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">
        Type: <span style="font-weight: 500;">${markerData.type}</span>
      </p>
      ${markerData.status ? `
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">
          Status: <span style="font-weight: 500; color: ${markerData.status === 'available' ? '#4CAF50' : '#FFC107'};">
            ${markerData.status}
          </span>
        </p>
      ` : ''}
      ${markerData.info ? `
        <p style="margin: 0; font-size: 14px; color: #888;">
          ${markerData.info}
        </p>
      ` : ''}
    </div>
  `
}

// Map control functions
const zoomIn = () => {
  if (map.value) {
    map.value.setZoom(map.value.getZoom() + 1)
  }
}

const zoomOut = () => {
  if (map.value) {
    map.value.setZoom(map.value.getZoom() - 1)
  }
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'Geolocation not supported'
    return
  }

  locationLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
      
      if (map.value) {
        map.value.setCenter(location)
        map.value.setZoom(15)
      }
      
      locationLoading.value = false
    },
    () => {
      error.value = 'Unable to get location'
      locationLoading.value = false
    }
  )
}

const refreshMap = () => {
  updateMarkers()
}

const toggleFullscreen = () => {
  if (mapContainer.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      mapContainer.value.requestFullscreen()
    }
  }
}

// Watch for prop changes
watch(() => props.markers, updateMarkers, { deep: true })
watch(() => props.center, (newCenter) => {
  if (map.value) {
    map.value.setCenter(newCenter)
  }
})

// Lifecycle
onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  markers.value.forEach(marker => marker.setMap(null))
})

// Expose public methods
defineExpose({
  refreshMap,
  getCurrentLocation,
  zoomIn,
  zoomOut
})
</script>

<style scoped>
.map-container {
  width: 100%;
}

.map-card {
  border-radius: 12px;
}

.map-wrapper {
  position: relative;
  overflow: hidden;
}

.google-map {
  border-radius: 0 0 12px 12px;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
}

.v-card-title {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  color: white;
}

.v-divider {
  border-color: rgba(255, 255, 255, 0.2);
}
</style>