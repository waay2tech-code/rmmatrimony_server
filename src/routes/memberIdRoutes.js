// src/routes/memberIdRoutes.js
const express = require('express');
const router = express.Router();
const {
  migrateAllUsers,
  getMemberIDStats,
  generateMemberIDForUser,
  getUsersWithoutMemberID,
  validateMemberID
} = require('../controllers/memberIdController');
const authMiddleware = require('../middlewares/authMiddleware');

// Admin middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin privileges',
      error: error.message
    });
  }
};

// Routes
// GET /api/memberid/stats - Get member ID statistics
router.get('/stats', authMiddleware, adminMiddleware, getMemberIDStats);

// POST /api/memberid/migrate - Migrate all existing users
router.post('/migrate', authMiddleware, adminMiddleware, migrateAllUsers);

// GET /api/memberid/users-without - Get users without member IDs
router.get('/users-without', authMiddleware, adminMiddleware, getUsersWithoutMemberID);

// POST /api/memberid/generate/:userId - Generate member ID for specific user
router.post('/generate/:userId', authMiddleware, adminMiddleware, generateMemberIDForUser);

// GET /api/memberid/validate/:memberid - Validate member ID format
router.get('/validate/:memberid', authMiddleware, adminMiddleware, validateMemberID);

module.exports = router;