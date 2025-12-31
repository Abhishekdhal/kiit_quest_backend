const Post = require('../models/Post');
//completed this file
// 1. Fetch all posts (Sorted by newest first)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Create a new community post (Admin only route)
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const newPost = new Post({
      authorName: req.user.name,
      authorId: req.user.id,
      content: content,
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Toggle Like/Unlike (Atomic Update Version)
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likedBy.includes(userId);

    let update;
    if (isLiked) {
      // Atomic Unlike: Decr count and pull ID in one database call
      update = { $inc: { likesCount: -1 }, $pull: { likedBy: userId } };
    } else {
      // Atomic Like: Incr count and push ID in one database call
      update = { $inc: { likesCount: 1 }, $push: { likedBy: userId } };
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true });
    res.status(200).json({ 
      likesCount: updatedPost.likesCount, 
      isLiked: !isLiked 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};