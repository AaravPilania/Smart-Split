const mongoose = require('mongoose');

mongoose.connection.on('connected',    () => console.log('✅ MongoDB connected'));
mongoose.connection.on('reconnected',  () => console.log('✅ MongoDB reconnected'));
mongoose.connection.on('error',        (err) => console.error('❌ MongoDB error:', err.message));

// Auto-reconnect on disconnect (Atlas maintenance, network blip, etc.)
let reconnectTimer = null;
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting reconnect...');
  if (reconnectTimer) return; // already scheduled
  let attempt = 0;
  const tryReconnect = async () => {
    attempt++;
    try {
      if (mongoose.connection.readyState === 0 && process.env.MONGODB_URI) {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          heartbeatFrequencyMS: 10000,
          maxIdleTimeMS: 45000,
        });
      }
      reconnectTimer = null;
    } catch (err) {
      console.error(`❌ Reconnect attempt ${attempt} failed: ${err.message}`);
      const delay = Math.min(attempt * 3000, 30000); // 3s, 6s, 9s... max 30s
      reconnectTimer = setTimeout(tryReconnect, delay);
    }
  };
  reconnectTimer = setTimeout(tryReconnect, 3000);
});

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
