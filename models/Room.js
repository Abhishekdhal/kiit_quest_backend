const mongoose = require('mongoose');

const questQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' }
});

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  branch: { type: String, required: true },
  semester: { type: String, required: true },
  subject: { type: String, required: true },
  hostId: { type: String, required: true },
  hostName: { type: String, required: true },
  players: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    score: { type: Number, default: 0 },
    isReady: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
  questions: [questQuestionSchema],
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete room after 1 hour
});

module.exports = mongoose.model('Room', roomSchema);
