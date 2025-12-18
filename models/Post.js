const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // The person writing the post
  authorName: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // The content
  content: { type: String, required: true, trim: true },
  
  // Likes management
  likesCount: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of IDs to prevent double-likes
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);