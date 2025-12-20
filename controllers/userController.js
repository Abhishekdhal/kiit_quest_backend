const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    // Standardize ID lookup to match your update logic
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-password'); 
    
    if (user) {
        res.json({
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            school: user.school || '', 
            branch: user.branch || '', 
            semester: user.semester || '',
            phone: user.phone || '',
            // ADDED: Return role so Flutter Admin UI works
            role: user.role || 'student', 
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
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.school = req.body.school || user.school;
        user.branch = req.body.branch || user.branch;
        user.semester = req.body.semester || user.semester;
        user.phone = req.body.phone || user.phone;

        // Password hashing is handled by the pre-save hook in models/User.js
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
            // ALREADY INCLUDED: This ensures admin status persists after update
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { 
    getUserProfile, 
    updateUserProfile 
};

// const asyncHandler = require('express-async-handler');
// const User = require('../models/User');
// const { removeListener } = require('../server');

// // @desc    Get user profile
// // @route   GET /api/user/profile
// // @access  Private
// const getUserProfile = asyncHandler(async (req, res) => {
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
//         });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// });

// // @desc    Update user profile
// // @route   PUT /api/user/profile
// // @access  Private
// const updateUserProfile = asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id || req.user.id);

//     if (user) {
//         // Update fields if they are provided in the request body, otherwise keep current values
//         user.name = req.body.name || user.name;
//         user.email = req.body.email || user.email;
//         user.school = req.body.school || user.school;
//         user.branch = req.body.branch || user.branch;
//         user.semester = req.body.semester || user.semester;
//         user.phone = req.body.phone || user.phone;

//         // If a password is being updated, it will be hashed by your User model's pre-save middleware
//         if (req.body.password) {
//             user.password = req.body.password;
//         }

//         const updatedUser = await user.save();

//         res.json({
//             _id: updatedUser._id,
//             name: updatedUser.name,
//             email: updatedUser.email,
//             school: updatedUser.school,
//             branch: updatedUser.branch,
//             semester: updatedUser.semester,
//             phone: updatedUser.phone,
//             role: updatedUser.role,
//         });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// });

// // IMPORTANT: You must export both functions
// module.exports = { 
//     getUserProfile, 
//     updateUserProfile 
// };
