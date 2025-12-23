const express = require('express');
const { getMaterialSubjects, getFilesBySubject } = require('../controllers/studyMaterialController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.get('/subjects', protect, getMaterialSubjects);
router.get('/files', protect, getFilesBySubject);

module.exports = router;