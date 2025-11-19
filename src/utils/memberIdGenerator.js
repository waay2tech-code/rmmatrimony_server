// src/utils/memberIdGenerator.js
const moment = require('moment');
const User = require('../models/User');
const { nanoid } = require("nanoid");

/**
 * Generate a unique member ID in format: RMYYYYMM + 3-digit sequential number
 * @param {Date} registrationDate - Date to use for member ID (defaults to current date)
 * @returns {Promise<string>} - Generated member ID
 */
const generateMemberID = async (registrationDate = new Date()) => {
  try {
    // Format: RMYYYYMM (e.g., "RM202501" for January 2025)
    const yearMonth = `RM${moment(registrationDate).format('YYYYMM')}`;
    
    // Count existing users with memberid starting with current year-month
    // const count = await User.countDocuments({ 
    //   memberid: new RegExp(`^${yearMonth}`) 
    // });

    // Generate new member ID: RMYYYYMM + incremental count (3 digits)
    // const memberIdNumber = count + 1;
    //  * Generate a unique member ID in format: RMYYYYMM + 5-char NanoID
    const memberid = `${yearMonth}${nanoid(5)}`;
    
    // Double check uniqueness (in case of concurrent requests)
    // const existingMember = await User.findOne({ memberid });
    // if (existingMember) {
    //   // If collision detected, try next number
    //   const nextNumber = count + 2;
    //   return `${yearMonth}${String(nextNumber).padStart(3, '0')}`;
    // }
    
    return memberid;
  } catch (error) {
    console.error('Error generating member ID:', error);
    throw error;
  }
};

/**
 * Ensure user has a member ID, generate one if missing
 * @param {string} userId - User ID to check
 * @returns {Promise<string>} - Member ID (existing or newly generated)
 */
const ensureMemberID = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If user already has a member ID, return it
    if (user.memberid) {
      return user.memberid;
    }

    // Generate member ID based on user's creation date
    const memberid = await generateMemberID(user.createdAt);
    
    // Update user with the generated member ID
    await User.findByIdAndUpdate(userId, { memberid });
    
    console.log(`Generated member ID ${memberid} for user ${user.name} (${user.email})`);
    return memberid;
  } catch (error) {
    console.error('Error ensuring member ID:', error);
    throw error;
  }
};

/**
 * Migrate all existing users without member IDs
 * @returns {Promise<Object>} - Migration results
 */
const migrateExistingUsers = async () => {
  try {
    console.log('🔄 Starting member ID migration for existing users...');
    
    // Find all users without member IDs
    const usersWithoutMemberID = await User.find({ 
      $or: [
        { memberid: { $exists: false } },
        { memberid: null },
        { memberid: '' }
      ]
    }).sort({ createdAt: 1 }); // Sort by oldest first

    if (usersWithoutMemberID.length === 0) {
      console.log('✅ All users already have member IDs');
      return { 
        success: true, 
        message: 'All users already have member IDs',
        processed: 0,
        errors: 0
      };
    }

    console.log(`📋 Found ${usersWithoutMemberID.length} users without member IDs`);
    
    let processed = 0;
    let errors = 0;
    const results = [];

    // Process users in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < usersWithoutMemberID.length; i += batchSize) {
      const batch = usersWithoutMemberID.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          const memberid = await generateMemberID(user.createdAt);
          
          await User.findByIdAndUpdate(user._id, { memberid });
          
          results.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            memberid: memberid,
            status: 'success'
          });
          
          processed++;
          console.log(`✅ Generated member ID ${memberid} for ${user.name} (${user.email})`);
        } catch (error) {
          console.error(`❌ Failed to generate member ID for user ${user.name}:`, error);
          results.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            memberid: null,
            status: 'error',
            error: error.message
          });
          errors++;
        }
      }));
      
      // Small delay between batches
      if (i + batchSize < usersWithoutMemberID.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`🎉 Migration completed! Processed: ${processed}, Errors: ${errors}`);
    
    return {
      success: true,
      message: `Member ID migration completed successfully`,
      processed,
      errors,
      results
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: 'Migration failed',
      error: error.message,
      processed: 0,
      errors: 1
    };
  }
};

/**
 * Validate member ID format
 * @param {string} memberid - Member ID to validate
 * @returns {boolean} - Is valid format
 */
const validateMemberID = (memberid) => {
  if (!memberid || typeof memberid !== 'string') {
    return false;
  }
  
  // Check format: RMYYYYMM + 3 digits (e.g., "RM202501001")
  const oldFormatRegex = /^RM(20\d{2})(0[1-9]|1[0-2])(\d{3})$/;
  // Check format: RMYYYYMM + 5-char NanoID
  const newFormatRegex = /^RM(20\d{2})(0[1-9]|1[0-2])[A-Za-z0-9_-]{5}$/;
  
  return oldFormatRegex.test(memberid) || newFormatRegex.test(memberid);
};

/**
 * Get member ID statistics
 * @returns {Promise<Object>} - Statistics about member IDs
 */
const getMemberIDStats = async () => {
  try {
    const totalUsers = await User.countDocuments({});
    const usersWithMemberID = await User.countDocuments({ 
      memberid: { $exists: true, $ne: '' } 
    });
    const usersWithoutMemberID = totalUsers - usersWithMemberID;
    
    // Get recent member IDs
    const recentMembers = await User.find({ 
      memberid: { $exists: true, $ne: '' } 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email memberid createdAt');
    
    return {
      totalUsers,
      usersWithMemberID,
      usersWithoutMemberID,
      completionPercentage: ((usersWithMemberID / totalUsers) * 100).toFixed(2),
      recentMembers
    };
  } catch (error) {
    console.error('Error getting member ID stats:', error);
    throw error;
  }
};

module.exports = {
  generateMemberID,
  ensureMemberID,
  migrateExistingUsers,
  validateMemberID,
  getMemberIDStats
};