const mongoose = require('mongoose');

const expenseSplitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, { _id: false });

const expenseSettlementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  settledAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitBetween: [expenseSplitSchema],
  settled: {
    type: Boolean,
    default: false
  },
  settledBy: [expenseSettlementSchema]
}, {
  timestamps: true
});

// Static methods
expenseSchema.statics.create = async function(title, amount, groupId, paidBy, splitBetween) {
  const expense = await this.create({
    title,
    amount,
    group: groupId,
    paidBy,
    splitBetween: splitBetween.map(split => ({
      user: split.user,
      amount: split.amount
    }))
  });

  return await this.findById(expense._id);
};

expenseSchema.statics.findById = async function(id) {
  return await this.findById(id)
    .populate('group', 'id name')
    .populate('paidBy', 'id name email')
    .populate('splitBetween.user', 'id name email')
    .populate('settledBy.user', 'id name email');
};

expenseSchema.statics.findByGroup = async function(groupId) {
  return await this.find({ group: groupId })
    .populate('group', 'id name')
    .populate('paidBy', 'id name email')
    .populate('splitBetween.user', 'id name email')
    .populate('settledBy.user', 'id name email')
    .sort({ createdAt: -1 });
};

expenseSchema.statics.findUnsettledByGroup = async function(groupId) {
  return await this.find({ group: groupId, settled: false })
    .populate('paidBy', 'id name email')
    .populate('splitBetween.user', 'id name email')
    .sort({ createdAt: -1 });
};

expenseSchema.statics.getSplits = async function(expenseId) {
  const expense = await this.findById(expenseId);
  return expense ? expense.splitBetween : [];
};

expenseSchema.statics.getSettlements = async function(expenseId) {
  const expense = await this.findById(expenseId);
  return expense ? expense.settledBy : [];
};

expenseSchema.statics.addSettlement = async function(expenseId, userId, amount) {
  const expense = await this.findById(expenseId);
  if (!expense) return null;

  expense.settledBy.push({
    user: userId,
    amount,
    settledAt: new Date()
  });

  // Check if fully settled
  const totalSettled = expense.settledBy.reduce((sum, settlement) => sum + settlement.amount, 0);
  if (totalSettled >= expense.amount) {
    expense.settled = true;
  }

  await expense.save();
  return await this.findById(expenseId);
};

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
