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
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/pyqs', require('./routes/pyqRoutes')); // PYQ Routes added

// Basic health check route
app.get('/', (req, res) => {
    res.send('KIIT Quest API is Running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));