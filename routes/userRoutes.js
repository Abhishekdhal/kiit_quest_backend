const express = require('express');
const router = express.Router();

// 1. Added deleteUserProfile to the destructuring import
const { 
    getUserProfile, 
    updateUserProfile, 
    deleteUserProfile // New function added here
} = require('../controllers/userController'); 

// 2. Imported the authentication middleware
const { protect } = require('../middleware/authMiddleware'); 

// --- ROUTE DEFINITIONS ---

// Use router.route() to chain different methods for the same path
router.route('/profile')
    // @route   GET /api/user/profile
    // @desc    Fetch user profile
    .get(protect, getUserProfile)
    
    // @route   PUT /api/user/profile
    // @desc    Update user profile
    .put(protect, updateUserProfile)
    
    // @route   DELETE /api/user/profile
    // @desc    Immediately delete user account
    .delete(protect, deleteUserProfile); // Account deletion logic triggered here

module.exports = router;

// const express = require('express');
// const router = express.Router();

// // 1. Added updateUserProfile to the destructuring import
// const { getUserProfile, updateUserProfile } = require('../controllers/userController'); 

// // 2. Imported the authentication middleware
// const { protect } = require('../middleware/authMiddleware'); 

// // @route   GET /api/user/profile
// // @desc    Fetch user profile
// // @access  Private
// router.get('/profile', protect, getUserProfile); 

// // @route   PUT /api/user/profile
// // @desc    Update user profile
// // @access  Private
// router.put('/profile', protect, updateUserProfile);

// module.exports = router;