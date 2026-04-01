const mongoose = require('mongoose');

const aaruCacheSchema = new mongoose.Schema({
  hash:      { type: String, required: true, unique: true, index: true },
  endpoint:  { type: String, required: true }, // 'advice', 'parse', 'category'
  response:  { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL: 24h auto-delete
});

module.exports = mongoose.model('AaruCache', aaruCacheSchema);
