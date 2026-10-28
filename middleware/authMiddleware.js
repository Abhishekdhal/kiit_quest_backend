const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'kiit_quest_jwt_default_secret_key_2026';

const resolveUserFromToken = async (token) => {
  // Enforce cryptographic signature verification (no unverified jwt.decode fallback)
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || (!decoded.id && !decoded._id && !decoded.email)) {
    throw new Error('Invalid token claims');
  }

  const userId = decoded.id || decoded._id;
  let user = null;
  if (userId) {
    try {
      user = await User.findById(userId).select('-password');
    } catch (_) {
      user = null;
    }
  }

  if (!user) {
    user = {
      _id: userId || 'student-user',
      id: userId || 'student-user',
      name: decoded.name || 'KIIT Student',
      email: decoded.email || `${userId || 'student'}@kiit.ac.in`,
      role: decoded.role || 'student',
      branch: decoded.branch || '(CSE) Computer Science & Engineering',
      semester: decoded.semester || 'Semester 5'
    };
  }
  return user;
};

// Strict authentication middleware: 401 if missing or invalid token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      req.user = await resolveUserFromToken(token);
      return next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  res.status(401);
  throw new Error('Not authorized, no token provided');
});

// Permissive authentication middleware for guest practice
const optionalAuth = asyncHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      req.user = await resolveUserFromToken(token);
      return next();
    } catch (error) {
      // If token provided is malformed/invalid, return 401 rather than silently falling back
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  // Provide isolated guest student context if no token provided
  req.user = {
    _id: 'guest-student',
    id: 'guest-student',
    name: 'KIIT Student',
    email: 'guest@student.kiit.ac.in',
    role: 'student',
    branch: '(CSE) Computer Science & Engineering',
    semester: 'Semester 5'
  };
  next();
});

module.exports = { protect, optionalAuth };

