const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const router = express.Router();

const postSchema = new mongoose.Schema({
    id: { type: Number, unique: true }, // Sequential ID
    userId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Function to get the next sequence ID
const getNextSequence = async (name) => {
    const counter = await Counter.findByIdAndUpdate(
        { _id: name }, 
        { $inc: { seq: 1 } }, 
        { new: true, upsert: true }
    );
    return counter.seq;
};

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findOne({ id: parseInt(req.params.id) });
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new post
router.post('/', auth, async (req, res) => {
    try {
        const postId = await getNextSequence('postId'); // Get next sequential ID
        const post = new Post({
            id: postId,
            userId: req.user.id,
            title: req.body.title,
            content: req.body.content
        });

        const savedPost = await post.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update post by ID
router.put('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findOne({ id: parseInt(req.params.id) });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;

        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findOne({ id: parseInt(req.params.id) });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        await Post.findByIdAndDelete(post._id); // Use findByIdAndDelete to delete the post by its _id
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
