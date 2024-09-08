const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticateJWT = require('../middlewares/authMiddleware');

// create a new post by authenticating the user
router.post('/create', authenticateJWT, postController.createPost);

// fetch all the posts
router.get('/', postController.getAllPosts);

// get posts for specified user
router.get('/user/:userId', postController.getUserPosts);

module.exports = router;
