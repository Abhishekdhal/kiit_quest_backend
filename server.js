const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const compression = require('compression');
const admin = require('firebase-admin');
require('dotenv').config();

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// --- FIREBASE ADMIN INITIALIZATION (FILE-FREE) ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // This regex fix is critical for Vercel to read the private key correctly
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin SDK Initialized Successfully');
  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error.message);
  }
}

// Connect to Database
connectDB();

const app = express();
app.set('trust proxy', 1);

// IMPORTANT: CORS must come BEFORE compression and body parsers
// so that preflight (OPTIONS) requests are handled correctly
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json());

// --- REGISTERED ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pyq', require('./routes/pyqRoutes'));
app.use('/api/user', require('./routes/userRoutes')); 
app.use('/api/pdf', require('./routes/pdfRoutes'));
app.use('/api/posts', require('./routes/postRoutes')); 
app.use('/api/study-material', require('./routes/studyMaterialRoutes'));
app.use('/api/quest', require('./routes/questRoutes'));

// Basic health check
app.get('/', (req, res) => {
  res.send('KIIT Quest API is Running...');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.url });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;