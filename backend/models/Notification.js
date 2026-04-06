const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  to:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['reminder'], default: 'reminder' },
  message: { type: String, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  amount:  { type: Number },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ to: 1, createdAt: -1 });
notificationSchema.index({ to: 1, read: 1 });

// Virtual `id` field
notificationSchema.virtual('id').get(function () { return this._id.toHexString(); });
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
