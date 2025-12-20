const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password'); 
    
    if (user) {
        res.json({
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            school: user.school || '', 
            branch: user.branch || '', 
            semester: user.semester || '',
            phone: user.phone || '',
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id || req.user.id);

    if (user) {
        // Update fields if they are provided in the request body, otherwise keep current values
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.school = req.body.school || user.school;
        user.branch = req.body.branch || user.branch;
        user.semester = req.body.semester || user.semester;
        user.phone = req.body.phone || user.phone;

        // If a password is being updated, it will be hashed by your User model's pre-save middleware
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            school: updatedUser.school,
            branch: updatedUser.branch,
            semester: updatedUser.semester,
            phone: updatedUser.phone,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// IMPORTANT: You must export both functions
module.exports = { 
    getUserProfile, 
    updateUserProfile 
};


// const asyncHandler = require('express-async-handler');
// const User = require('../models/User');

// // @desc    Get user profile
// // @route   GET /api/user/profile
// // @access  Private
// const getUserProfile = asyncHandler(async (req, res) => {
//     // req.user is set by your 'protect' middleware after decoding the JWT
//     const user = await User.findById(req.user.id).select('-password'); 
    
//     if (user) {
//         res.json({
//             _id: user._id, 
//             name: user.name, 
//             email: user.email, 
//             school: user.school || '', 
//             branch: user.branch || '', 
//             semester: user.semester || '',
//             phone: user.phone || '',
//             // Add other profile fields here
//         });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// });

// // Implement updateUserProfile here...

// module.exports = { getUserProfile };