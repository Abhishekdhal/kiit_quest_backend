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

// -----------------------------------------------------------------
// FIX: REGISTER THE USER PROFILE ROUTES TO FIX THE 404
app.use('/api/user', require('./routes/userRoutes')); 
// -----------------------------------------------------------------

// Basic health check route
app.get('/', (req, res) => {
  res.send('KIIT Quest API is Running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));