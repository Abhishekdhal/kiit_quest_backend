const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors()); 

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pyq', require('./routes/pyqRoutes'));
app.use('/api/user', require('./routes/userRoutes')); 
app.use('/api/pdf', require('./routes/pdfProxy')); // ← FIXED: Changed from pdfRoutes to pdfProxy

// Basic health check route
app.get('/', (req, res) => {
  res.send('KIIT Quest API is Running...');
});

// Test route to verify PDF proxy is registered
app.get('/api/test-routes', (req, res) => {
  res.json({
    message: 'Available routes',
    routes: [
      '/api/auth',
      '/api/pyq',
      '/api/user',
      '/api/pdf ← PDF Proxy Route'
    ]
  });
});

// 404 handler for debugging
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url,
    method: req.method,
    hint: 'Check if the route is registered in server.js'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('📋 Registered routes:');
  console.log('   • /api/auth - Authentication');
  console.log('   • /api/pyq - Previous Year Questions');
  console.log('   • /api/user - User Profile');
  console.log('   • /api/pdf - PDF Proxy ← NEW');
});

// Export for Vercel
module.exports = app;

// const express = require('express');
// const connectDB = require('./config/db');
// const cors = require('cors');
// require('dotenv').config();

// // Connect to Database
// connectDB();

// const app = express();

// // Middleware
// app.use(express.json()); 
// app.use(cors()); 

// // Define Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/pyq', require('./routes/pyqRoutes'));

// // -----------------------------------------------------------------// FIX: REGISTER THE USER PROFILE ROUTES TO FIX THE 404
// app.use('/api/user', require('./routes/userRoutes')); 
// app.use('/api/pdf', require('./routes/pdfProxy'));


// // Basic health check route
// app.get('/', (req, res) => {
//   res.send('KIIT Quest API is Running...');
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));