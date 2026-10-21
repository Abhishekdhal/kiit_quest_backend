const express = require('express');
const {
  generateQuestions,
  createRoom,
  joinRoom,
  startRoomGame,
  submitPlayerScore,
  getRoomState
} = require('../controllers/questController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/generate', protect, generateQuestions);
router.post('/room/create', protect, createRoom);
router.post('/room/join', protect, joinRoom);
router.post('/room/start', protect, startRoomGame);
router.post('/room/score', protect, submitPlayerScore);
router.get('/room/:code', protect, getRoomState);

module.exports = router;
