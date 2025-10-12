const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cruddb', );
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error connecting to MongoDB:', error.message);
    }
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (process.env.NODE_ENV !== 'production') {
      console.log('MongoDB Disconnected');
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error disconnecting from MongoDB:', error.message);
    }
  }
};

const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionState
};