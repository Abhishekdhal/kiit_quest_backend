const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/authController');

const router = express.Router();

/**
 * SECURITY: Rate limiter specifically for password recovery to prevent spam
 * Limits an IP to 3 requests every 15 minutes for the 'forgot' endpoint.
 */
const recoveryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3, 
    message: { message: 'Too many recovery attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * MIDDLEWARE: Validation helper
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- AUTH ROUTES ---

// @desc    Register new user
router.post(
    '/signup', 
    [
        body('email').isEmail().withMessage('Please provide a valid KIIT email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').notEmpty().withMessage('Name is required')
    ],
    validate,
    registerUser
);

// @desc    Authenticate a user
router.post(
    '/login', 
    [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').exists().withMessage('Password is required')
    ],
    validate,
    loginUser
);

// --- PASSWORD MANAGEMENT ---

// @desc    Request password reset (With Rate Limiting)
router.post(
    '/forgot-password', 
    recoveryLimiter,
    body('email').isEmail().withMessage('Valid email required'),
    validate,
    forgotPassword
);

// @desc    Reset password using OTP
router.post(
    '/reset-password', 
    [
        body('email').isEmail(),
        body('otp').isLength({ min: 4, max: 4 }).withMessage('Invalid 4-digit OTP'),
        body('newPassword').isLength({ min: 6 })
    ],
    validate,
    resetPassword
);

module.exports = router;

// const express = require('express');
// const { registerUser, loginUser } = require('../controllers/authController');

// const router = express.Router();

// router.post('/signup', registerUser);
// router.post('/login', loginUser);

// module.exports = router;