// src/controllers/memberIdController.js
const { 
  migrateExistingUsers, 
  getMemberIDStats, 
  ensureMemberID,
  validateMemberID 
} = require('../utils/memberIdGenerator');
const User = require('../models/User');

/**
 * Admin endpoint to migrate all existing users without member IDs
 */
exports.migrateAllUsers = async (req, res) => {
  try {
    console.log('🔄 Starting member ID migration via admin request...');
    
    const result = await migrateExistingUsers();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          processed: result.processed,
          errors: result.errors,
          results: result.results
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Migration controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start migration',
      error: error.message
    });
  }
};

/**
 * Get member ID statistics
 */
exports.getMemberIDStats = async (req, res) => {
  try {
    const stats = await getMemberIDStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get member ID statistics',
      error: error.message
    });
  }
};

/**
 * Generate member ID for a specific user
 */
exports.generateMemberIDForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user already has a member ID
    if (user.memberid) {
      return res.status(400).json({
        success: false,
        message: 'User already has a member ID',
        data: {
          memberid: user.memberid
        }
      });
    }
    
    // Generate member ID
    const memberid = await ensureMemberID(userId);
    
    res.status(200).json({
      success: true,
      message: 'Member ID generated successfully',
      data: {
        userId: userId,
        memberid: memberid,
        userName: user.name,
        userEmail: user.email
      }
    });
    
  } catch (error) {
    console.error('Generate member ID controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate member ID',
      error: error.message
    });
  }
};

/**
 * Get users without member IDs
 */
exports.getUsersWithoutMemberID = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find users without member IDs
    const users = await User.find({ 
      $or: [
        { memberid: { $exists: false } },
        { memberid: null },
        { memberid: '' }
      ]
    })
    .select('name email mobile createdAt')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    const totalCount = await User.countDocuments({ 
      $or: [
        { memberid: { $exists: false } },
        { memberid: null },
        { memberid: '' }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Get users without member ID controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users without member IDs',
      error: error.message
    });
  }
};

/**
 * Validate member ID format
 */
exports.validateMemberID = async (req, res) => {
  try {
    const { memberid } = req.params;
    
    if (!memberid) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }
    
    const isValid = validateMemberID(memberid);
    
    res.status(200).json({
      success: true,
      data: {
        memberid,
        isValid,
        format: isValid ? 'Valid (YYYYMM + 3 digits)' : 'Invalid format'
      }
    });
    
  } catch (error) {
    console.error('Validate member ID controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate member ID',
      error: error.message
    });
  }
};

module.exports = {
  migrateAllUsers: exports.migrateAllUsers,
  getMemberIDStats: exports.getMemberIDStats,
  generateMemberIDForUser: exports.generateMemberIDForUser,
  getUsersWithoutMemberID: exports.getUsersWithoutMemberID,
  validateMemberID: exports.validateMemberID
};