const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Dummy posts array
let posts = [];

// Get posts
router.get('/', (req, res) => {
    res.json(posts);
});

// Create post
router.post('/', auth, (req, res) => {
    const post = { id: posts.length + 1, userId: req.user.id, ...req.body };
    posts.push(post);
    res.status(201).json(post);
});

module.exports = router;
