const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const authenticateJWT = require('../middlewares/authMiddleware');

// create a new post by authenticating the user
router.post('/post', authenticateJWT, interactionController.createPost);
router.post('/comment', authenticateJWT, interactionController.createComment);
router.get('/post/for/:id', authenticateJWT, interactionController.getAllPostsForUserId);
router.get('/comment/for/:post_id', authenticateJWT, interactionController.getCommentsForPost);

router.post('/post/upvote/:id', authenticateJWT, interactionController.upvote);
router.post('/post/downvote/:id', authenticateJWT, interactionController.downvote);

// fetch all the posts
// router.get('/post', postController.getAllPosts);

// get posts for specified user
// router.get('/user/:userId', postController.getUserPosts);

module.exports = router;
