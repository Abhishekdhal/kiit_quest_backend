const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    school: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, default: 'student' }, 
    
    // --- NEW: OTP FIELDS ---
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    otpRequestCount: { type: Number, default: 0 },
    lastOtpRequest: { type: Date }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { 
        return next(); 
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     school: { type: String, required: true },
//     branch: { type: String, required: true },
//     semester: { type: String, required: true },
//     phone: { type: String, required: true },
//     // CRITICAL: Add this so the 'admin' role is saved in the DB
//     role: { type: String, default: 'student' }, 
// }, { timestamps: true });

// // FIX: Remove 'next' from arguments and calls
// userSchema.pre('save', async function () {
//     if (!this.isModified('password')) { 
//         return; // Just return if not modified
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
// });

// userSchema.methods.matchPassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', userSchema);
// module.exports = User;
