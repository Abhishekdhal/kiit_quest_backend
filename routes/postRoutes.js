// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, toggleLike } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminAuth');

router.get('/all', protect, getAllPosts); // Everyone views
router.put('/:id/like', protect, toggleLike); // Everyone likes
router.post('/posts/create', protect, isAdmin, createPost); // ONLY ADMIN POSTS ✅

module.exports = router;