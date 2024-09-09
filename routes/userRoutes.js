const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateJWT = require('../middlewares/authMiddleware');

router.get('/:id', authenticateJWT, userController.getUserNameById);

module.exports = router;