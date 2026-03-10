const mongoose = require('mongoose');

mongoose.connection.on('connected',    () => console.log('✅ MongoDB connected'));
mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected — will auto-reconnect'));
mongoose.connection.on('reconnected',  () => console.log('✅ MongoDB reconnected'));
mongoose.connection.on('error',        (err) => console.error('❌ MongoDB error:', err.message));

/**
 * Tries to connect to MongoDB, retrying up to `maxRetries` times with
 * exponential backoff. This means a temporary Atlas blip or Render IP
 * change will never permanently kill the server.
 */
const connectDB = async (maxRetries = 5) => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in environment variables');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        maxIdleTimeMS: 45000,
      });
      return; // success
    } catch (err) {
      console.error(`❌ MongoDB connect attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      const wait = attempt * 3000; // 3s, 6s, 9s, 12s …
      console.log(`   Retrying in ${wait / 1000}s…`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
};

module.exports = { connectDB };
