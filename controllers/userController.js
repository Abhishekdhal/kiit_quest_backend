const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is set by your 'protect' middleware after decoding the JWT
    const user = await User.findById(req.user.id).select('-password'); 
    
    if (user) {
        res.json({
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            school: user.school, 
            branch: user.branch, 
            semester: user.semester,
            phone: user.phone,
            // Add other profile fields here
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Implement updateUserProfile here...

module.exports = { getUserProfile };