const mongoose = require('mongoose');

const groupRequestSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  respondedAt: { type: Date, default: null }
}, { timestamps: true });

const GroupRequestModel = mongoose.model('GroupRequest', groupRequestSchema);

const POPULATE_REQUEST = [
  { path: 'user', select: 'name email' },
  { path: 'group', select: 'name description createdBy' }
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
  async createRequest(groupId, userId) {
    const request = await GroupRequestModel.create({ group: groupId, user: userId });
    return doc2obj(request);
  },

  async findOne(filter) {
    return doc2obj(await GroupRequestModel.findOne(filter));
  },

  async findByGroup(groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
    const requests = await GroupRequestModel.find({ group: groupId, status: 'pending' }).populate(POPULATE_REQUEST).sort({ createdAt: -1 });
    return requests.map(doc2obj);
  },

  async findByUser(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const requests = await GroupRequestModel.find({ user: userId }).populate(POPULATE_REQUEST).sort({ createdAt: -1 });
    return requests.map(doc2obj);
  },

  async approveRequest(requestId) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) return null;
    const request = await GroupRequestModel.findOne({ _id: requestId, status: 'pending' });
    if (!request) return null;
    await GroupRequestModel.findByIdAndUpdate(requestId, { $set: { status: 'approved', respondedAt: new Date() } });
    const Group = require('./Group');
    await Group.addMember(request.group.toString(), request.user.toString());
    return { ...doc2obj(request), status: 'approved' };
  },

  async rejectRequest(requestId) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) return null;
    const request = await GroupRequestModel.findOne({ _id: requestId, status: 'pending' });
    if (!request) return null;
    await GroupRequestModel.findByIdAndUpdate(requestId, { $set: { status: 'rejected', respondedAt: new Date() } });
    return { ...doc2obj(request), status: 'rejected' };
  }
};