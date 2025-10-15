const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod = null;

const connectMemoryDB = async () => {
  try {
    console.log('🚀 Starting in-memory MongoDB for testing...');
    
    // Create in-memory MongoDB instance
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'rmmatrimony'
      }
    });

    const uri = mongod.getUri();
    console.log('📍 Memory MongoDB URI:', uri);

    // Connect to the in-memory database
    await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB successfully');
    
    return uri;
  } catch (error) {
    console.error('❌ Memory MongoDB setup failed:', error);
    throw error;
  }
};

const disconnectMemoryDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
    console.log('🛑 Memory MongoDB stopped');
  } catch (error) {
    console.error('❌ Error stopping memory MongoDB:', error);
  }
};

module.exports = { connectMemoryDB, disconnectMemoryDB };