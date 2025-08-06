<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list-item
        prepend-avatar="/logo.png"
        :title="rail ? '' : 'ZippUp Admin'"
        subtitle="Management Dashboard"
        nav
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            icon="mdi-chevron-left"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.route"
          :value="item.title"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn
            block
            prepend-icon="mdi-logout"
            text="Logout"
            variant="outlined"
            @click="handleLogout"
          ></v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar elevation="1">
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <v-app-bar-title>{{ currentPageTitle }}</v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- Real-time Stats -->
      <v-chip
        class="ma-2"
        color="success"
        prepend-icon="mdi-account-multiple"
      >
        {{ stats.activeUsers }} Active Users
      </v-chip>

      <v-chip
        class="ma-2"
        color="warning"
        prepend-icon="mdi-alert"
      >
        {{ stats.activeEmergencies }} Emergencies
      </v-chip>

      <v-chip
        class="ma-2"
        color="primary"
        prepend-icon="mdi-bookmark"
      >
        {{ stats.pendingBookings }} Pending
      </v-chip>

      <!-- Notifications -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-bell"
            v-bind="props"
          >
            <v-badge
              v-if="notifications.length > 0"
              :content="notifications.length"
              color="error"
            >
              <v-icon>mdi-bell</v-icon>
            </v-badge>
            <v-icon v-else>mdi-bell</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            @click="handleNotificationClick(notification)"
          >
            <v-list-item-title>{{ notification.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- User Menu -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            class="ma-2"
            v-bind="props"
          >
            <v-avatar size="32">
              <v-img
                :src="user?.avatar || '/default-avatar.png'"
                alt="User Avatar"
              ></v-img>
            </v-avatar>
            <span class="ml-2">{{ user?.name || 'Admin' }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="navigateToProfile">
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>
          <v-list-item @click="navigateToSettings">
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="handleLogout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <!-- Loading Overlay -->
    <v-overlay
      v-model="loading"
      class="align-center justify-center"
    >
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>

    <!-- Emergency Alert Dialog -->
    <v-dialog
      v-model="emergencyDialog"
      max-width="500px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h5 red--text">
          🚨 Emergency Alert
        </v-card-title>
        <v-card-text>
          <div v-if="currentEmergency">
            <p><strong>Type:</strong> {{ currentEmergency.type }}</p>
            <p><strong>Location:</strong> {{ currentEmergency.location }}</p>
            <p><strong>Description:</strong> {{ currentEmergency.description }}</p>
            <p><strong>Priority:</strong> 
              <v-chip :color="getPriorityColor(currentEmergency.priority)">
                {{ currentEmergency.priority }}
              </v-chip>
            </p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            text
            @click="emergencyDialog = false"
          >
            Dismiss
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="viewEmergencyDetails"
          >
            View Details
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useStatsStore } from './stores/stats'
import { useNotificationStore } from './stores/notifications'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const statsStore = useStatsStore()
const notificationStore = useNotificationStore()

// Reactive data
const drawer = ref(true)
const rail = ref(false)
const loading = ref(false)
const emergencyDialog = ref(false)
const currentEmergency = ref(null)

// Computed properties
const user = computed(() => authStore.user)
const stats = computed(() => statsStore.stats)
const notifications = computed(() => notificationStore.notifications)

const currentPageTitle = computed(() => {
  const routeName = route.name as string
  return pageTitle[routeName] || 'Dashboard'
})

// Menu items
const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', route: '/dashboard' },
  { title: 'Users', icon: 'mdi-account-multiple', route: '/users' },
  { title: 'Providers', icon: 'mdi-account-tie', route: '/providers' },
  { title: 'Services', icon: 'mdi-wrench', route: '/services' },
  { title: 'Bookings', icon: 'mdi-bookmark', route: '/bookings' },
  { title: 'Emergencies', icon: 'mdi-alert', route: '/emergencies' },
  { title: 'Payments', icon: 'mdi-credit-card', route: '/payments' },
  { title: 'Analytics', icon: 'mdi-chart-line', route: '/analytics' },
  { title: 'Reports', icon: 'mdi-file-chart', route: '/reports' },
  { title: 'Settings', icon: 'mdi-cog', route: '/settings' },
]

const pageTitle: Record<string, string> = {
  dashboard: 'Dashboard Overview',
  users: 'User Management',
  providers: 'Provider Management',
  services: 'Service Management',
  bookings: 'Booking Management',
  emergencies: 'Emergency Management',
  payments: 'Payment Management',
  analytics: 'Analytics & Insights',
  reports: 'Reports & Export',
  settings: 'System Settings',
}

// Methods
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

const handleNotificationClick = (notification: any) => {
  // Handle notification click
  if (notification.type === 'emergency') {
    router.push(`/emergencies/${notification.emergencyId}`)
  } else if (notification.type === 'booking') {
    router.push(`/bookings/${notification.bookingId}`)
  }
  notificationStore.markAsRead(notification.id)
}

const navigateToProfile = () => {
  router.push('/profile')
}

const navigateToSettings = () => {
  router.push('/settings')
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'purple',
  }
  return colors[priority] || 'grey'
}

const viewEmergencyDetails = () => {
  if (currentEmergency.value) {
    router.push(`/emergencies/${currentEmergency.value.id}`)
    emergencyDialog.value = false
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Initialize stores
  await statsStore.fetchStats()
  await notificationStore.fetchNotifications()
  
  // Set up real-time listeners
  statsStore.startRealTimeUpdates()
  notificationStore.startRealTimeUpdates()
  
  // Listen for emergency alerts
  notificationStore.onEmergencyAlert((emergency: any) => {
    currentEmergency.value = emergency
    emergencyDialog.value = true
  })
})

onUnmounted(() => {
  // Clean up listeners
  statsStore.stopRealTimeUpdates()
  notificationStore.stopRealTimeUpdates()
})
</script>

<style scoped>
.v-navigation-drawer {
  z-index: 1002;
}

.v-app-bar {
  z-index: 1001;
}

.emergency-alert {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
}
</style>