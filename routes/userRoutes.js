const express = require('express');
const router = express.Router();

// 1. Added updateUserProfile to the destructuring import
const { getUserProfile, updateUserProfile } = require('../controllers/userController'); 

// 2. Imported the authentication middleware
const { protect } = require('../middleware/authMiddleware'); 

// @route   GET /api/user/profile
// @desc    Fetch user profile
// @access  Private
router.get('/profile', protect, getUserProfile); 

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateUserProfile);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// // Assuming you have a userController that defines getUserProfile and updateUserProfile
// const { getUserProfile } = require('../controllers/userController'); 
// const { protect } = require('../middleware/authMiddleware'); // Assuming your JWT authentication middleware

// // @route   GET /api/user/profile (Needed to fetch profile after signup)
// // @access  Private
// //router.get('/profile', protect, getUserProfile); 

// // @route   PUT /api/user/profile (Needed for updating profile)
// // @access  Private
// //router.put('/profile', protect, updateUserProfile);

// module.exports = router;