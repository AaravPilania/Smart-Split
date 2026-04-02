const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true },
  monthlyBudget: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  active: { type: Boolean, default: true },
}, { timestamps: true });

goalSchema.index({ user: 1, active: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = {
  create: (data) => Goal.create(data),
  findByUser: (userId) => Goal.find({ user: userId }).sort({ createdAt: -1 }),
  findById: (id) => Goal.findById(id),
  updateById: (id, updates) => Goal.findByIdAndUpdate(id, updates, { new: true }),
  deleteById: (id) => Goal.findByIdAndDelete(id),
};
