const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { register, login, getMe, adminLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/me', authMiddleware, getMe);

module.exports = router;
