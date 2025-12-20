const express = require('express');
const { getSubjects, getYears, getFileUrl } = require('../controllers/pyqController');
// Import your authentication middleware
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

// Adding protect middleware to all routes
router.get('/subjects', protect, getSubjects);
router.get('/years', protect, getYears);
router.get('/file-url', protect, getFileUrl);

module.exports = router;

// const express = require('express');
// const { getSubjects, getYears, getFileUrl } = require('../controllers/pyqController');
// // You may want to create a middleware (e.g., protect) for production to verify user token
// const router = express.Router();

// router.get('/subjects', getSubjects);
// router.get('/years', getYears);
// router.get('/file-url', getFileUrl);

// module.exports = router;