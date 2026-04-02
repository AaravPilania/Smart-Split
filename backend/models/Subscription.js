const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'subscription', trim: true },
  billingCycle: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
  nextBillingDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  color: { type: String, default: '#6b7280' },
  icon: { type: String, default: '' },
}, { timestamps: true });

subscriptionSchema.index({ user: 1, active: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = {
  create: (data) => Subscription.create(data),
  findByUser: (userId) => Subscription.find({ user: userId }).sort({ nextBillingDate: 1 }),
  findActiveByUser: (userId) => Subscription.find({ user: userId, active: true }).sort({ nextBillingDate: 1 }),
  findById: (id) => Subscription.findById(id),
  updateById: (id, updates) => Subscription.findByIdAndUpdate(id, updates, { new: true }),
  deleteById: (id) => Subscription.findByIdAndDelete(id),
};
