import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '4rem', 
          margin: '0 0 20px 0',
          fontWeight: 'bold',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          🚀 ZippUp
        </h1>
        <h2 style={{ 
          fontSize: '1.5rem', 
          margin: '0 0 10px 0',
          fontWeight: '300',
          opacity: '0.9'
        }}>
          Multi-Service On-Demand Platform
        </h2>
        <p style={{ 
          fontSize: '1.1rem', 
          margin: '0',
          opacity: '0.8',
          maxWidth: '600px'
        }}>
          Your one-stop platform for on-demand services, emergency support, marketplace goods, and digital services
        </p>
      </div>

      {/* Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        maxWidth: '800px',
        width: '100%',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🗺️</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>Real-Time Tracking</h3>
          <p style={{ margin: '0', opacity: '0.9', fontSize: '0.95rem' }}>
            Track service providers and orders in real-time with interactive maps
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚨</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>Emergency Services</h3>
          <p style={{ margin: '0', opacity: '0.9', fontSize: '0.95rem' }}>
            24/7 emergency response with panic button and instant dispatch
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💳</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>Secure Wallet</h3>
          <p style={{ margin: '0', opacity: '0.9', fontSize: '0.95rem' }}>
            Integrated wallet with Stripe payments for seamless transactions
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🛒</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>Marketplace</h3>
          <p style={{ margin: '0', opacity: '0.9', fontSize: '0.95rem' }}>
            Buy goods from local vendors and access digital services
          </p>
        </div>
      </div>

      {/* Service Categories */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Available Services</h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          justifyContent: 'center',
          maxWidth: '600px'
        }}>
          {[
            '🚗 Transport', '🚑 Emergency', '💇‍♀️ Personal Care', 
            '📱 Tech Services', '🔧 Home Services', '🏗️ Construction',
            '💳 Digital Services', '🛒 Marketplace'
          ].map((service, index) => (
            <span key={index} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              {service}
            </span>
          ))}
        </div>
      </div>

      {/* Status */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>🎉 Platform Status</h4>
        <p style={{ margin: '0', fontSize: '0.95rem', opacity: '0.9' }}>
          ✅ Firebase Backend: <strong>Active</strong><br/>
          ✅ Google Maps: <strong>Integrated</strong><br/>
          ✅ Stripe Payments: <strong>Configured</strong><br/>
          ✅ Multi-Platform: <strong>Ready</strong>
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '40px', 
        textAlign: 'center', 
        opacity: '0.7',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: '0' }}>
          🌟 Your comprehensive multi-service platform is ready!
        </p>
        <p style={{ margin: '10px 0 0 0' }}>
          Mobile App • Web Platform • Admin Dashboard
        </p>
      </div>
    </div>
  );
}

export default App;