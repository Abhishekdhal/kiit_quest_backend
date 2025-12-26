const express = require('express');
const { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/authController');

const router = express.Router();

// --- Auth Routes ---

// @desc    Register new user
// @route   POST /api/auth/signup
router.post('/signup', registerUser);

// @desc    Authenticate a user
// @route   POST /api/auth/login
router.post('/login', loginUser);

// --- Password Management Routes ---

// @desc    Request password reset (Sends OTP/Link to email)
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @desc    Reset password using token/OTP
// @route   POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;

// const express = require('express');
// const { registerUser, loginUser } = require('../controllers/authController');

// const router = express.Router();

// router.post('/signup', registerUser);
// router.post('/login', loginUser);

// module.exports = router;