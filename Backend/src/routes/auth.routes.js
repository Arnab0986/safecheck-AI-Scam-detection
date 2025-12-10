const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const authMiddleware = require('../middleware/auth.middleware');

// ------------------------
// PUBLIC AUTH ROUTES
// ------------------------
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Forgot password (PUBLIC)
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// Reset password (PUBLIC)
router.post('/reset-password', authLimiter, authController.resetPassword);

// ------------------------
// PROTECTED ROUTES
// ------------------------
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
