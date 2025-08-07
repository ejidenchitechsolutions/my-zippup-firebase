<template>
  <div class="dashboard">
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">Dashboard Overview</h1>
            <p class="text-subtitle-1 text-grey-darken-1">
              Real-time platform monitoring and management
            </p>
          </div>
          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="refreshData"
              :loading="loading"
            >
              Refresh
            </v-btn>
            <v-btn
              color="secondary"
              prepend-icon="mdi-download"
              @click="exportReport"
            >
              Export
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Key Metrics Cards -->
    <v-row class="mb-6">
      <v-col
        v-for="metric in keyMetrics"
        :key="metric.title"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card
          :color="metric.color"
          dark
          class="metric-card"
          elevation="4"
        >
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption mb-1 text-white-darken-1">
                  {{ metric.title }}
                </p>
                <h2 class="text-h3 font-weight-bold">
                  {{ formatNumber(metric.value) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon
                    :icon="metric.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                    size="small"
                    class="mr-1"
                  ></v-icon>
                  <span class="text-caption">
                    {{ Math.abs(metric.trend) }}% vs last week
                  </span>
                </div>
              </div>
              <v-avatar size="64" color="rgba(255,255,255,0.2)">
                <v-icon :icon="metric.icon" size="32"></v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Emergency Monitoring Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-alert" color="red" class="mr-2"></v-icon>
            Emergency Monitoring
            <v-spacer></v-spacer>
            <v-chip
              :color="emergencies.active.length > 0 ? 'red' : 'green'"
              variant="flat"
            >
              {{ emergencies.active.length }} Active
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <div v-if="emergencies.active.length > 0">
                  <v-alert
                    v-for="emergency in emergencies.active.slice(0, 3)"
                    :key="emergency.id"
                    :color="getPriorityColor(emergency.priority)"
                    variant="tonal"
                    class="mb-3"
                  >
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <strong>{{ emergency.type.toUpperCase() }}</strong> - 
                        {{ emergency.location }}
                        <br>
                        <small>{{ formatTimeAgo(emergency.createdAt) }}</small>
                      </div>
                      <v-btn
                        size="small"
                        color="primary"
                        @click="viewEmergency(emergency.id)"
                      >
                        View Details
                      </v-btn>
                    </div>
                  </v-alert>
                  <v-btn
                    v-if="emergencies.active.length > 3"
                    text
                    color="primary"
                    @click="viewAllEmergencies"
                  >
                    View All {{ emergencies.active.length }} Active Emergencies
                  </v-btn>
                </div>
                <div v-else class="text-center py-4">
                  <v-icon icon="mdi-check-circle" size="48" color="green"></v-icon>
                  <p class="text-h6 mt-2">No Active Emergencies</p>
                  <p class="text-body-2 text-grey-darken-1">All clear! 🎉</p>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <apexchart
                  type="donut"
                  :options="emergencyChartOptions"
                  :series="emergencyChartSeries"
                  height="200"
                ></apexchart>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Bookings Chart -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            Bookings Overview
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="bookingsPeriod" mandatory>
              <v-btn value="24h" size="small">24H</v-btn>
              <v-btn value="7d" size="small">7D</v-btn>
              <v-btn value="30d" size="small">30D</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <apexchart
              type="area"
              :options="bookingsChartOptions"
              :series="bookingsChartSeries"
              height="300"
            ></apexchart>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Revenue Chart -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Revenue Distribution</v-card-title>
          <v-card-text>
            <apexchart
              type="pie"
              :options="revenueChartOptions"
              :series="revenueChartSeries"
              height="300"
            ></apexchart>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activity & Quick Actions -->
    <v-row>
      <!-- Recent Activity -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-card-text>
            <v-timeline density="compact">
              <v-timeline-item
                v-for="activity in recentActivity"
                :key="activity.id"
                :dot-color="activity.color"
                size="small"
              >
                <div class="d-flex justify-space-between">
                  <div>
                    <strong>{{ activity.title }}</strong>
                    <p class="text-body-2 text-grey-darken-1 mb-0">
                      {{ activity.description }}
                    </p>
                  </div>
                  <small class="text-grey-darken-1">
                    {{ formatTimeAgo(activity.timestamp) }}
                  </small>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Actions -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="action in quickActions"
                :key="action.title"
                @click="action.action"
                :prepend-icon="action.icon"
              >
                <v-list-item-title>{{ action.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ action.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- System Status -->
        <v-card class="mt-4">
          <v-card-title>System Status</v-card-title>
          <v-card-text>
            <div
              v-for="status in systemStatus"
              :key="status.service"
              class="d-flex justify-space-between align-center mb-2"
            >
              <span>{{ status.service }}</span>
              <v-chip
                :color="status.status === 'healthy' ? 'green' : 'red'"
                size="small"
              >
                {{ status.status }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStatsStore } from '../stores/stats'
import { useEmergencyStore } from '../stores/emergency'
import { format, formatDistanceToNow } from 'date-fns'

const router = useRouter()
const statsStore = useStatsStore()
const emergencyStore = useEmergencyStore()

// Reactive data
const loading = ref(false)
const bookingsPeriod = ref('7d')

// Computed properties
const keyMetrics = computed(() => [
  {
    title: 'Total Users',
    value: statsStore.stats.totalUsers,
    trend: 12.5,
    icon: 'mdi-account-multiple',
    color: 'primary',
  },
  {
    title: 'Active Bookings',
    value: statsStore.stats.activeBookings,
    trend: 8.2,
    icon: 'mdi-bookmark',
    color: 'secondary',
  },
  {
    title: 'Emergency Calls',
    value: statsStore.stats.emergencyCalls,
    trend: -5.1,
    icon: 'mdi-alert',
    color: 'error',
  },
  {
    title: 'Revenue Today',
    value: statsStore.stats.revenueToday,
    trend: 15.3,
    icon: 'mdi-currency-usd',
    color: 'success',
  },
])

const emergencies = computed(() => emergencyStore.emergencies)

const emergencyChartOptions = computed(() => ({
  chart: {
    type: 'donut',
  },
  labels: ['Medical', 'Fire', 'Police', 'Roadside', 'Security'],
  colors: ['#FF6B6B', '#FF8E53', '#4ECDC4', '#45B7D1', '#96CEB4'],
  legend: {
    show: false,
  },
}))

const emergencyChartSeries = computed(() => [
  emergencies.value.byType.medical || 0,
  emergencies.value.byType.fire || 0,
  emergencies.value.byType.police || 0,
  emergencies.value.byType.roadside || 0,
  emergencies.value.byType.security || 0,
])

const bookingsChartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: {
      show: false,
    },
  },
  xaxis: {
    categories: getBookingsPeriodLabels(),
  },
  yaxis: {
    title: {
      text: 'Number of Bookings',
    },
  },
  stroke: {
    curve: 'smooth',
  },
  colors: ['#6C5CE7'],
}))

const bookingsChartSeries = computed(() => [{
  name: 'Bookings',
  data: getBookingsData(),
}])

const revenueChartOptions = computed(() => ({
  chart: {
    type: 'pie',
  },
  labels: ['Transport', 'Home Services', 'Personal Care', 'Tech Services', 'Emergency'],
  colors: ['#6C5CE7', '#00B894', '#E91E63', '#2196F3', '#E53E3E'],
}))

const revenueChartSeries = computed(() => [35, 25, 20, 15, 5])

const recentActivity = computed(() => statsStore.recentActivity)

const quickActions = [
  {
    title: 'Verify Provider',
    description: 'Review pending provider applications',
    icon: 'mdi-account-check',
    action: () => router.push('/providers?status=pending'),
  },
  {
    title: 'Emergency Dispatch',
    description: 'Monitor active emergencies',
    icon: 'mdi-ambulance',
    action: () => router.push('/emergencies'),
  },
  {
    title: 'Generate Report',
    description: 'Create custom analytics report',
    icon: 'mdi-file-chart',
    action: () => router.push('/reports'),
  },
  {
    title: 'System Settings',
    description: 'Configure platform settings',
    icon: 'mdi-cog',
    action: () => router.push('/settings'),
  },
]

const systemStatus = computed(() => [
  { service: 'API Gateway', status: 'healthy' },
  { service: 'Database', status: 'healthy' },
  { service: 'Payment Service', status: 'healthy' },
  { service: 'Notification Service', status: 'healthy' },
  { service: 'Map Service', status: 'healthy' },
])

// Methods
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTimeAgo = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
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

const getBookingsPeriodLabels = () => {
  // Generate labels based on selected period
  const period = bookingsPeriod.value
  if (period === '24h') {
    return Array.from({ length: 24 }, (_, i) => `${i}:00`)
  } else if (period === '7d') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  } else {
    return Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`)
  }
}

const getBookingsData = () => {
  // Mock data - replace with actual data from store
  const period = bookingsPeriod.value
  if (period === '24h') {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 50))
  } else if (period === '7d') {
    return [120, 150, 180, 200, 170, 160, 190]
  } else {
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 200))
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      statsStore.fetchStats(),
      emergencyStore.fetchEmergencies(),
    ])
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  // Implement export functionality
  console.log('Exporting report...')
}

const viewEmergency = (emergencyId: string) => {
  router.push(`/emergencies/${emergencyId}`)
}

const viewAllEmergencies = () => {
  router.push('/emergencies')
}

// Watch for period changes to update chart
watch(bookingsPeriod, () => {
  // Fetch new data based on selected period
  // This would typically call an API with the new period
})

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.metric-card {
  transition: transform 0.2s ease-in-out;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.gap-2 {
  gap: 8px;
}
</style>