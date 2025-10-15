const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser, forgotPassword, resetPassword, adminRegister } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');


router.post('/register', register);
router.post('/admin/register', adminRegister); // Special route for admin registration
router.post('/login', login);
router.post('/logout', logout);
router.get("/me", authMiddleware, getCurrentUser);


// ✅ Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;