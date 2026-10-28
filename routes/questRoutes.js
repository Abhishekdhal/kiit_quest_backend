const express = require('express');
const {
  generateQuestions,
  submitQuiz,
  getRecommendations,
  createRoom,
  joinRoom,
  startRoomGame,
  submitPlayerScore,
  getRoomState,
  getCurriculumTopics,
  getStudentProgress,
  submitRoomAnswers
} = require('../controllers/questController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/generate', optionalAuth, generateQuestions);
router.post('/submit', optionalAuth, submitQuiz);
router.get('/recommendations', protect, getRecommendations);
router.get('/topics', optionalAuth, getCurriculumTopics);
router.get('/progress', protect, getStudentProgress);
router.post('/room/create', protect, createRoom);
router.post('/room/join', protect, joinRoom);
router.post('/room/start', protect, startRoomGame);
router.post('/room/score', protect, submitPlayerScore);
router.post('/room/submit', protect, submitRoomAnswers);
router.post('/room/answers', protect, submitRoomAnswers);
router.get('/room/:code', protect, getRoomState);

module.exports = router;
