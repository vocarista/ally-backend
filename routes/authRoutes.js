const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middlewares/authMiddleware');

router.post('/register/admin', authController.registerAdmin);
router.post('/register/student', authController.registerStudent);
router.post('/register/alumni', authController.registerAlumni);
router.post('/login', authController.login);
router.get('/verify', authenticateJWT, authController.verify);

module.exports = router;