// middleware/adminAuth.js

const isAdmin = (req, res, next) => {
  // Check if req.user exists and has the role 'admin'
  if (req.user && req.user.role === 'admin') {
    next(); // Access granted, move to the next function
  } else {
    // 403 Forbidden: The server understands but refuses to authorize
    res.status(403).json({ 
      message: "Access Denied: You do not have permission to post announcements." 
    });
  }
};

module.exports = { isAdmin };