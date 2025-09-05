const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validateEmail = require('../middleware/validateEmail');
const validatePassword = require('../middleware/validatePassword');

// Signup route
router.post('/signup', validateEmail, validatePassword, authController.signup);

// Login route
router.post('/login', authController.login);

// Get current user route (protected)
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;