const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');
const authenticateJWT = require('../middlewares/authMiddleware');

router.get('/', universityController.getAllUniversities);
router.get('/:id', authenticateJWT, universityController.getUniversityById);
router.post('/', authenticateJWT, universityController.registerUniversity);

module.exports = router;