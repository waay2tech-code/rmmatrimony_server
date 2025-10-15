// scripts/remove-existing-member-ids.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the User model
const User = require('../src/models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📚 MongoDB connected for removing existing member IDs');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Main function to remove all existing member IDs
const removeExistingMemberIds = async () => {
  try {
    console.log('🚀 Starting Member ID removal process...');
    console.log('⏰ Started at:', new Date().toISOString());
    console.log('==========================================');

    // Connect to database
    await connectDB();

    // Count users with existing member IDs
    const usersWithMemberId = await User.countDocuments({ 
      memberid: { $exists: true, $ne: null } 
    });
    
    console.log(`📋 Found ${usersWithMemberId} users with existing member IDs`);

    if (usersWithMemberId === 0) {
      console.log('✅ No users with member IDs found');
      await mongoose.connection.close();
      console.log('📚 Database connection closed');
      process.exit(0);
    }

    // Remove all member IDs by setting them to null
    const result = await User.updateMany(
      { memberid: { $exists: true, $ne: null } },
      { $set: { memberid: null } }
    );

    console.log('==========================================');
    console.log('📊 Removal Results:');
    console.log(`✅ Successfully removed member IDs from ${result.modifiedCount} users`);
    console.log(`📈 Matched users: ${result.matchedCount}`);

    console.log('==========================================');
    console.log('⏰ Completed at:', new Date().toISOString());
    console.log('🎉 Member ID removal process finished!');

    // Close database connection
    await mongoose.connection.close();
    console.log('📚 Database connection closed');

    process.exit(0);

  } catch (error) {
    console.error('❌ Member ID removal process failed:', error);

    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
};

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\\n⚠️  Member ID removal process interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('📚 Database connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\\n⚠️  Member ID removal process terminated');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('📚 Database connection closed');
  }
  process.exit(0);
});

// Run the removal process
if (require.main === module) {
  removeExistingMemberIds();
}

module.exports = { removeExistingMemberIds };