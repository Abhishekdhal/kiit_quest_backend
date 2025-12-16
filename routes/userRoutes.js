const express = require('express');
const router = express.Router();
// Assuming you have a userController that defines getUserProfile and updateUserProfile
const { getUserProfile } = require('../controllers/userController'); 
const { protect } = require('../middleware/authMiddleware'); // Assuming your JWT authentication middleware

// @route   GET /api/user/profile (Needed to fetch profile after signup)
// @access  Private
router.get('/profile', protect, getUserProfile); 

// @route   PUT /api/user/profile (Needed for updating profile)
// @access  Private
// router.put('/profile', protect, updateUserProfile);

module.exports = router;