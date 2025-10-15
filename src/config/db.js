const mongoose = require('mongoose');
const { connectMemoryDB } = require('./memoryDB');

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  // First try MongoDB Atlas or external connection
  if (MONGO_URI && !MONGO_URI.includes('testcluster.abc123')) {
    try {
      console.log('🔄 Attempting to connect to MongoDB Atlas...');
      console.log('🔗 Connection string:', MONGO_URI.replace(/\/\/.*@/, '//***:***@'));
      
      // @ts-ignore - MongoDB connection options
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout for quick fail
        socketTimeoutMS: 10000,
      });
      
      console.log('✅ MongoDB Atlas connected successfully');
      return;
    } catch (err) {
      console.warn('⚠️ MongoDB Atlas connection failed:', err.message);
      console.log('🔄 Falling back to in-memory database...');
    }
  }

  // Fallback to in-memory database
  try {
    await connectMemoryDB();
    console.log('✅ Using in-memory MongoDB - your app is ready!');
    console.log('💡 For production, set up MongoDB Atlas and update MONGO_URI in .env');
  } catch (err) {
    console.error('❌ All database connection attempts failed:', err.message);
    console.log('📋 Check BACKEND_SETUP_QUICK_FIX.md for solutions');
    process.exit(1);
  }
};

module.exports = connectDB;