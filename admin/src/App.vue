<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="logo">🛠️ ZippUp Admin</h1>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">1,234</span>
            <span class="stat-label">Active Users</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">56</span>
            <span class="stat-label">Live Bookings</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">$12,450</span>
            <span class="stat-label">Today's Revenue</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-grid">
        <!-- Welcome Card -->
        <div class="card welcome-card">
          <h2>🎉 Welcome to ZippUp Admin Dashboard</h2>
          <p>Your comprehensive platform management center is ready!</p>
          <div class="platform-status">
            <div class="status-item">
              <span class="status-icon">✅</span>
              <span>Firebase Backend: <strong>Active</strong></span>
            </div>
            <div class="status-item">
              <span class="status-icon">✅</span>
              <span>Google Maps: <strong>Integrated</strong></span>
            </div>
            <div class="status-item">
              <span class="status-icon">✅</span>
              <span>Stripe Payments: <strong>Configured</strong></span>
            </div>
            <div class="status-item">
              <span class="status-icon">✅</span>
              <span>Real-time Tracking: <strong>Ready</strong></span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card actions-card">
          <h3>⚡ Quick Actions</h3>
          <div class="action-buttons">
            <button class="action-btn primary">
              👥 Manage Users
            </button>
            <button class="action-btn secondary">
              🚗 Track Providers
            </button>
            <button class="action-btn warning">
              🚨 Emergency Center
            </button>
            <button class="action-btn success">
              💰 Financial Reports
            </button>
          </div>
        </div>

        <!-- Service Overview -->
        <div class="card services-card">
          <h3>🛠️ Service Categories</h3>
          <div class="services-grid">
            <div class="service-item" v-for="service in services" :key="service.name">
              <span class="service-icon">{{ service.icon }}</span>
              <div class="service-info">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-count">{{ service.count }} providers</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card activity-card">
          <h3>📊 Recent Activity</h3>
          <div class="activity-list">
            <div class="activity-item" v-for="activity in recentActivity" :key="activity.id">
              <span class="activity-icon" :class="activity.type">{{ activity.icon }}</span>
              <div class="activity-content">
                <span class="activity-text">{{ activity.text }}</span>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- System Stats -->
        <div class="card stats-card">
          <h3>📈 System Performance</h3>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">99.9%</div>
              <div class="stat-desc">Uptime</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">1.2s</div>
              <div class="stat-desc">Avg Response</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">156</div>
              <div class="stat-desc">Active Providers</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">2.4k</div>
              <div class="stat-desc">Daily Bookings</div>
            </div>
          </div>
        </div>

        <!-- Platform Info -->
        <div class="card info-card">
          <h3>🌟 Platform Features</h3>
          <ul class="feature-list">
            <li>✅ Real-time provider tracking with Google Maps</li>
            <li>✅ Emergency services with panic button</li>
            <li>✅ Secure wallet system with Stripe integration</li>
            <li>✅ Multi-platform support (Mobile + Web + Admin)</li>
            <li>✅ Marketplace for goods and digital services</li>
            <li>✅ AI-powered search and recommendations</li>
            <li>✅ Comprehensive analytics and reporting</li>
            <li>✅ 24/7 monitoring and support system</li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      services: [
        { name: 'Transport', icon: '🚗', count: 45 },
        { name: 'Emergency', icon: '🚑', count: 12 },
        { name: 'Personal Care', icon: '💇‍♀️', count: 28 },
        { name: 'Tech Services', icon: '📱', count: 33 },
        { name: 'Home Services', icon: '🔧', count: 67 },
        { name: 'Construction', icon: '🏗️', count: 19 },
        { name: 'Digital Services', icon: '💳', count: 41 },
        { name: 'Marketplace', icon: '🛒', count: 89 }
      ],
      recentActivity: [
        { id: 1, icon: '👤', text: 'New user registered: John Doe', time: '2 min ago', type: 'user' },
        { id: 2, icon: '🚗', text: 'Provider went online: Mike\'s Plumbing', time: '5 min ago', type: 'provider' },
        { id: 3, icon: '📱', text: 'New booking created: Tech Support', time: '8 min ago', type: 'booking' },
        { id: 4, icon: '💰', text: 'Payment processed: $125.00', time: '12 min ago', type: 'payment' },
        { id: 5, icon: '🚨', text: 'Emergency resolved successfully', time: '15 min ago', type: 'emergency' }
      ]
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', sans-serif;
}

.dashboard-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  color: white;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.dashboard-main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.welcome-card {
  grid-column: span 2;
}

.welcome-card h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.welcome-card p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.platform-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
}

.status-icon {
  font-size: 1.2rem;
}

.actions-card h3,
.services-card h3,
.activity-card h3,
.stats-card h3,
.info-card h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-btn {
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.primary {
  background: #667eea;
  color: white;
}

.action-btn.secondary {
  background: #764ba2;
  color: white;
}

.action-btn.warning {
  background: #f093fb;
  color: white;
}

.action-btn.success {
  background: #4facfe;
  color: white;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.service-item {
  text-align: center;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
}

.service-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.service-name {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.2rem;
}

.service-count {
  font-size: 0.8rem;
  color: #666;
}

.activity-list {
  space-y: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  margin-bottom: 0.8rem;
}

.activity-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.2);
}

.activity-content {
  flex: 1;
}

.activity-text {
  display: block;
  color: #333;
  font-weight: 500;
}

.activity-time {
  font-size: 0.8rem;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-box {
  text-align: center;
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-desc {
  color: #666;
  font-size: 0.9rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 0.5rem 0;
  color: #333;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.feature-list li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .welcome-card {
    grid-column: span 1;
  }
}
</style>