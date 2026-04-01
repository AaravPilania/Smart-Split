const mongoose = require('mongoose');

/**
 * Per-user rate limiter for Aaru/Gemini endpoints.
 * Uses a lightweight MongoDB collection to track request counts.
 * Limits: 10 requests/hour, 50 requests/day per user.
 */

const aaruUsageSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  window:    { type: String, required: true }, // 'hour' or 'day'
  windowKey: { type: String, required: true }, // e.g. '2026-04-01T14' or '2026-04-01'
  count:     { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 90000 }, // auto-cleanup after 25h
});
aaruUsageSchema.index({ userId: 1, window: 1, windowKey: 1 }, { unique: true });

const AaruUsage = mongoose.model('AaruUsage', aaruUsageSchema);

const HOUR_LIMIT = 10;
const DAY_LIMIT = 50;

async function aaruRateLimit(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const now = new Date();
    const hourKey = now.toISOString().slice(0, 13); // '2026-04-01T14'
    const dayKey = now.toISOString().slice(0, 10);   // '2026-04-01'

    // Check hour limit
    const hourDoc = await AaruUsage.findOneAndUpdate(
      { userId, window: 'hour', windowKey: hourKey },
      { $inc: { count: 1 }, $setOnInsert: { createdAt: now } },
      { upsert: true, new: true }
    );
    if (hourDoc.count > HOUR_LIMIT) {
      return res.status(429).json({
        message: `Aaru is taking a short break! You've used ${HOUR_LIMIT} requests this hour. Try again soon.`,
        retryAfter: 'next hour',
      });
    }

    // Check day limit
    const dayDoc = await AaruUsage.findOneAndUpdate(
      { userId, window: 'day', windowKey: dayKey },
      { $inc: { count: 1 }, $setOnInsert: { createdAt: now } },
      { upsert: true, new: true }
    );
    if (dayDoc.count > DAY_LIMIT) {
      return res.status(429).json({
        message: `You've reached ${DAY_LIMIT} Aaru requests today. Your limit resets at midnight.`,
        retryAfter: 'midnight',
      });
    }

    next();
  } catch (error) {
    // On failure, allow the request through (fail-open)
    next();
  }
}

module.exports = aaruRateLimit;
