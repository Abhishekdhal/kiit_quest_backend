const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

// Global error handlers to surface uncaught errors during startup/runtime
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors()); 

// --- REGISTERED ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pyq', require('./routes/pyqRoutes'));
app.use('/api/user', require('./routes/userRoutes')); 
app.use('/api/pdf', require('./routes/pdfRoutes'));

// ✅ ADDED: Community/Post Routes
app.use('/api/posts', require('./routes/postRoutes')); 
app.use('/api/study-material', require('./routes/studyMaterialRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('KIIT Quest API is Running...');
});

// Test route to verify all routes (Updated)
app.get('/api/test-routes', (req, res) => {
  res.json({
    message: 'Available routes',
    routes: [
      '/api/auth',
      '/api/pyq',
      '/api/user',
      '/api/pdf',
      '/api/posts' // Added here
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
  console.log('   • /api/pdf - PDFs');
  console.log('   • /api/posts - Community Posts ✅'); // Added here
  console.log('   • /api/study-material - Study Materials ✅');
});

// Export for Vercel
module.exports = app;