const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  groupId:   { type: String, required: true, index: true },
  actorId:   { type: String, required: true },
  actorName: { type: String, default: '' },
  action:    { type: String, required: true },   // e.g. "added_expense", "settled", "edited_expense"
  details:   { type: String, default: '' },       // human-readable summary
  meta:      { type: Object, default: {} },        // optional structured data
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
