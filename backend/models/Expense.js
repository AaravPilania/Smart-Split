const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }
}, { _id: false });

const settlementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  settledAt: { type: Date, default: Date.now }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitBetween: [splitSchema],
  settled: { type: Boolean, default: false },
  settledBy: [settlementSchema]
}, { timestamps: true });

const ExpenseModel = mongoose.model('Expense', expenseSchema);

const POPULATE_EXPENSE = [
  { path: 'paidBy', select: 'name email' },
  { path: 'group', select: 'name' },
  { path: 'splitBetween.user', select: 'name email' },
  { path: 'settledBy.user', select: 'name email' }
];

function doc2obj(doc) {
  if (!doc) return null;
  const plain = JSON.parse(JSON.stringify(
    doc.toObject ? doc.toObject({ virtuals: true }) : doc
  ));
  if (!plain.id && plain._id) plain.id = plain._id;
  return plain;
}

module.exports = {
  async createExpense(title, amount, groupId, paidById, splitBetween) {
    const expense = await ExpenseModel.create({
      title: title.trim(),
      amount,
      group: groupId,
      paidBy: paidById,
      splitBetween: splitBetween.map(s => ({ user: s.user, amount: s.amount })),
      settled: false,
      settledBy: []
    });
    return doc2obj(await ExpenseModel.findById(expense._id).populate(POPULATE_EXPENSE));
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return doc2obj(await ExpenseModel.findById(id));
  },

  async findByIdPopulated(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return doc2obj(await ExpenseModel.findById(id).populate(POPULATE_EXPENSE));
  },

  async findByGroup(groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
    const expenses = await ExpenseModel.find({ group: groupId }).populate(POPULATE_EXPENSE).sort({ createdAt: -1 });
    return expenses.map(doc2obj);
  },

  async findUnsettledByGroup(groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
    const expenses = await ExpenseModel.find({ group: groupId, settled: false }).populate(POPULATE_EXPENSE).sort({ createdAt: -1 });
    return expenses.map(doc2obj);
  },

  async addSettlement(expenseId, userId, amount) {
    if (!mongoose.Types.ObjectId.isValid(expenseId)) return null;
    const expense = await ExpenseModel.findById(expenseId);
    if (!expense) return null;
    const currentTotal = expense.settledBy.reduce((sum, s) => sum + s.amount, 0);
    const isFullySettled = (currentTotal + amount) >= expense.amount;
    await ExpenseModel.findByIdAndUpdate(expenseId, {
      $push: { settledBy: { user: userId, amount, settledAt: new Date() } },
      $set: { settled: isFullySettled }
    });
    return this.findByIdPopulated(expenseId);
  }
};
