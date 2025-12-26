const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// 1. JWT Token Generator
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 2. Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // e.g., kiitquest@gmail.com
        pass: process.env.EMAIL_PASS  // 16-digit App Password
    }
});

// 3. Register User
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, school, branch, semester, phone } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name, email, password, school, branch, semester, phone
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            school: user.school,
            branch: user.branch,
            semester: user.semester,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// 4. Login User
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            school: user.school,
            branch: user.branch,
            semester: user.semester,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// 5. Request Password Reset OTP
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    const genericResponse = { message: 'If an account exists with that email, an OTP has been sent.' };

    if (!user) {
        return res.status(200).json(genericResponse);
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (user.lastOtpRequest && user.lastOtpRequest < twentyFourHoursAgo) {
        user.otpRequestCount = 0;
    }

    if (user.otpRequestCount >= 15) {
        res.status(429);
        throw new Error('Daily OTP limit reached. Try again in 24 hours.');
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60000; 
    user.otpRequestCount += 1;
    user.lastOtpRequest = now;
    await user.save();

    await transporter.sendMail({
        from: `"KIIT Quest" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset OTP - KIIT Quest',
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <h2 style="color: #1a237e;">Password Reset Request</h2>
                <p>Your 4-digit verification code is:</p>
                <h1 style="color: #5e35b1; letter-spacing: 10px; font-size: 40px;">${otp}</h1>
                <p>This code will expire in 10 minutes.</p>
            </div>
        `
    });

    res.status(200).json(genericResponse);
});

// 6. Verify OTP and Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        res.status(400);
        throw new Error('Please provide all fields');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
    }

    const user = await User.findOne({
        email,
        resetPasswordOTP: otp,
        resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    user.password = newPassword; 
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Password reset successful.' });
});

// CRITICAL: All 4 functions must be exported here
module.exports = { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword 
};


// const asyncHandler = require('express-async-handler');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');

// // Generate JWT Token
// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // Transporter setup for kiitquest@gmail.com
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER, // kiitquest@gmail.com
//         pass: process.env.EMAIL_PASS  // Your 16-digit App Password
//     }
// });

// // @desc    Register new user
// // @route   POST /api/auth/signup
// const registerUser = asyncHandler(async (req, res) => {
//     const { name, email, password, school, branch, semester, phone } = req.body;

//     if (!name || !email || !password) {
//         res.status(400);
//         throw new Error('Please add all fields');
//     }

//     const userExists = await User.findOne({ email });
//     if (userExists) {
//         res.status(400);
//         throw new Error('User already exists');
//     }

//     const user = await User.create({
//         name, email, password, school, branch, semester, phone
//     });

//     if (user) {
//         res.status(201).json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             school: user.school,
//             branch: user.branch,
//             semester: user.semester,
//             phone: user.phone,
//             role: user.role,
//             token: generateToken(user._id),
//         });
//     } else {
//         res.status(400);
//         throw new Error('Invalid user data');
//     }
// });

// // @desc    Authenticate a user
// // @route   POST /api/auth/login
// const loginUser = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (user && (await user.matchPassword(password))) {
//         res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             school: user.school,
//             branch: user.branch,
//             semester: user.semester,
//             phone: user.phone,
//             role: user.role,
//             token: generateToken(user._id),
//         });
//     } else {
//         res.status(401);
//         throw new Error('Invalid email or password');
//     }
// });

// // @desc    Request Password Reset OTP (Max 2 per 24 hours)
// // @route   POST /api/auth/forgot-password
// const forgotPassword = asyncHandler(async (req, res) => {
//     const { email } = req.body;
//     const user = await User.findOne({ email });

//     if (!user) {
//         res.status(404);
//         throw new Error('User not found');
//     }

//     const now = new Date();
//     const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//     // ✅ LOGIC: Reset counter if the last request was more than 24 hours ago
//     if (user.lastOtpRequest && user.lastOtpRequest < twentyFourHoursAgo) {
//         user.otpRequestCount = 0;
//     }

//     // ✅ LOGIC: Block if user has already requested 2 OTPs in the current 24h window
//     if (user.otpRequestCount >= 2) {
//         res.status(429); // 429 Too Many Requests
//         throw new Error('Daily OTP limit reached (2 per day). Please try again after 24 hours.');
//     }

//     // Generate 4-digit OTP
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
//     // Save OTP and Increment Counter
//     user.resetPasswordOTP = otp;
//     user.resetPasswordExpires = Date.now() + 10 * 60000; // 10 mins expiry
//     user.otpRequestCount += 1;
//     user.lastOtpRequest = now;
//     await user.save();

//     // Send Email
//     const mailOptions = {
//         from: `"KIIT Quest" <${process.env.EMAIL_USER}>`,
//         to: user.email,
//         subject: 'Password Reset OTP - KIIT Quest',
//         html: `
//             <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
//                 <h2 style="color: #1a237e;">Password Reset Request</h2>
//                 <p>Your 4-digit verification code is:</p>
//                 <h1 style="color: #5e35b1; letter-spacing: 10px; font-size: 40px;">${otp}</h1>
//                 <p>This code will expire in 10 minutes.</p>
//                 <p style="color: #777;">If you did not request this, please ignore this email.</p>
//             </div>
//         `
//     };

//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: 'OTP sent to your email' });
// });

// // @desc    Verify OTP and Reset Password
// // @route   POST /api/auth/reset-password
// const resetPassword = asyncHandler(async (req, res) => {
//     const { email, otp, newPassword } = req.body;

//     const user = await User.findOne({
//         email,
//         resetPasswordOTP: otp,
//         resetPasswordExpires: { $gt: Date.now() } 
//     });

//     if (!user) {
//         res.status(400);
//         throw new Error('Invalid or expired OTP');
//     }

//     // Update password
//     user.password = newPassword; 
//     user.resetPasswordOTP = undefined;
//     user.resetPasswordExpires = undefined;
    
//     // Note: This also resets the daily count upon successful reset (optional)
//     // user.otpRequestCount = 0; 
    
//     await user.save();

//     res.status(200).json({ message: 'Password reset successful' });
// });

// module.exports = { registerUser, loginUser, forgotPassword, resetPassword };







// const asyncHandler = require('express-async-handler');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');

// // Generate JWT Token
// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // @desc    Register new user
// // @route   POST /api/auth/signup
// // @access  Public
// const registerUser = asyncHandler(async (req, res) => {
//     const { name, email, password, school, branch, semester, phone } = req.body;

//     if (!name || !email || !password) {
//         res.status(400);
//         throw new Error('Please add all fields');
//     }

//     // Check if user exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//         res.status(400);
//         throw new Error('User already exists');
//     }

//     try {
//         // Create user
//         const user = await User.create({
//             name,
//             email,
//             password,
//             school,
//             branch,
//             semester,
//             phone
//         });

//         if (user) {
//             res.status(201).json({
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 school: user.school,
//                 branch: user.branch,
//                 semester: user.semester,
//                 phone: user.phone,
//                 role: user.role, // ✅ Included to sync with Flutter User model
//                 token: generateToken(user._id),
//             });
//         } else {
//             res.status(400);
//             throw new Error('Invalid user data');
//         }
//     } catch (error) {
//         res.status(400).json({ 
//             message: 'Invalid user data', 
//             error: error.message 
//         });
//     }
// });

// // @desc    Authenticate a user
// // @route   POST /api/auth/login
// // @access  Public
// const loginUser = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     // Find user by email
//     const user = await User.findOne({ email });

//     // Check password using the matchPassword method in your User model
//     if (user && (await user.matchPassword(password))) {
//         res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             school: user.school,
//             branch: user.branch,
//             semester: user.semester,
//             phone: user.phone,
//             role: user.role, // ✅ Crucial for showing the Admin Post button
//             token: generateToken(user._id),
//         });
//     } else {
//         res.status(401);
//         throw new Error('Invalid email or password');
//     }
// });

// module.exports = { registerUser, loginUser };