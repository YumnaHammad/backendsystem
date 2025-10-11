const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register); // POST http://localhost:5000/api/auth/register
router.post('/login', login);       // POST http://localhost:5000/api/auth/login
router.get('/profile', authenticateToken, getProfile); // GET profile

module.exports = router;
