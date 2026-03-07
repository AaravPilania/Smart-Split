const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    if (isConnected) return;

    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://default:default@cluster0.mongodb.net/splitwise?retryWrites=true&w=majority';

    await mongoose.connect(mongoURI);

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const getConnection = () => {
  if (!isConnected) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return mongoose.connection;
};

module.exports = { connectDB, getConnection };