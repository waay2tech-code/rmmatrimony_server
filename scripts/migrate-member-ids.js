// scripts/migrate-member-ids.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the migration utility
const { migrateExistingUsers } = require('../src/utils/memberIdGenerator');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📚 MongoDB connected for migration');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Main migration function
const runMigration = async () => {
  try {
    console.log('🚀 Starting Member ID Migration Script...');
    console.log('⏰ Started at:', new Date().toISOString());
    console.log('==========================================');
    
    // Connect to database
    await connectDB();
    
    // Run migration
    const result = await migrateExistingUsers();
    
    console.log('==========================================');
    console.log('📊 Migration Results:');
    console.log(`✅ Successfully processed: ${result.processed} users`);
    console.log(`❌ Errors encountered: ${result.errors} users`);
    console.log(`📈 Success rate: ${result.processed > 0 ? ((result.processed / (result.processed + result.errors)) * 100).toFixed(2) : 0}%`);
    
    if (result.results && result.results.length > 0) {
      console.log('\\n📝 Detailed Results:');
      result.results.forEach((user, index) => {
        if (user.status === 'success') {
          console.log(`${index + 1}. ✅ ${user.name} (${user.email}) → ${user.memberid}`);
        } else {
          console.log(`${index + 1}. ❌ ${user.name} (${user.email}) → Error: ${user.error}`);
        }
      });
    }
    
    console.log('==========================================');
    console.log('⏰ Completed at:', new Date().toISOString());
    console.log('🎉 Migration script finished!');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('📚 Database connection closed');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
};

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\\n⚠️  Migration script interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('📚 Database connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\\n⚠️  Migration script terminated');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('📚 Database connection closed');
  }
  process.exit(0);
});

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };