const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'web/build')));

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ZippUp Platform is running',
    timestamp: new Date().toISOString(),
    platform: 'Firebase App Hosting'
  });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/build', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 ZippUp Platform server running on port ${port}`);
  console.log(`🌐 Serving React app from: ${path.join(__dirname, 'web/build')}`);
});

module.exports = app;