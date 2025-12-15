const express = require('express');
const { getSubjects, getYears, getFileUrl } = require('../controllers/pyqController');
// You may want to create a middleware (e.g., protect) for production to verify user token
const router = express.Router();

router.get('/subjects', getSubjects);
router.get('/years', getYears);
router.get('/file-url', getFileUrl);

module.exports = router;