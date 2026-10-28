const mongoose = require('mongoose');

const questQuestionSchema = new mongoose.Schema({
  id: { type: String },
  question_id: { type: String },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, default: '' },
  explanation: { type: String, default: '' },
  attempt_id: { type: String, default: null }
}, { strict: false });

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
    isReady: { type: Boolean, default: false },
    hasSubmitted: { type: Boolean, default: false }
  }],
  topic: { type: String, default: 'Whole Subject' },
  timeLimit: { type: Number, default: 10 },
  questionCount: { type: Number, default: 10 },
  status: { type: String, enum: ['waiting', 'active', 'in_progress', 'finished'], default: 'waiting' },
  attempt_id: { type: String, default: null },
  questions: [questQuestionSchema],
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete room after 1 hour
});

module.exports = mongoose.model('Room', roomSchema);
