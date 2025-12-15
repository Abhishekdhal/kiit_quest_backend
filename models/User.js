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
    // Removed phone field for simplification, add if needed.
}, { timestamps: true });

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { return next(); }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method for login comparison
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;