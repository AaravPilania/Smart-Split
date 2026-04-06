const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  group:  { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  from:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  to:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  amount: { type: Number, required: true },
  note:   { type: String, default: '' }
}, { timestamps: true });

paymentSchema.index({ group: 1 });

const PaymentModel = mongoose.model('Payment', paymentSchema);

const POPULATE_PAYMENT = [
  { path: 'from', select: 'name email' },
  { path: 'to',   select: 'name email' }
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
  async create(groupId, fromId, toId, amount, note = '') {
    const payment = await PaymentModel.create({ group: groupId, from: fromId, to: toId, amount, note });
    return doc2obj(await PaymentModel.findById(payment._id).populate(POPULATE_PAYMENT));
  },

  async findByGroup(groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
    const payments = await PaymentModel.find({ group: groupId })
      .populate(POPULATE_PAYMENT)
      .sort({ createdAt: -1 });
    return payments.map(doc2obj);
  },

  async deleteByGroup(groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return;
    await PaymentModel.deleteMany({ group: groupId });
  }
};
