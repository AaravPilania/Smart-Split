const mongoose = require('mongoose');

// Log connection lifecycle events so we can see drops/reconnects in Render logs
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected — will auto-reconnect'));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err.message));

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in environment variables');
  }
  // serverSelectionTimeoutMS: how long to wait for initial connection
  // heartbeatFrequencyMS: how often to check the connection is alive
  // maxIdleTimeMS: close idle sockets after 45s (prevents stale connections)
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: 45000,
  });
};

module.exports = { connectDB };
