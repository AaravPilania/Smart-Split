const mongoose = require('mongoose');

const groupRequestSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure unique pending request per user per group
groupRequestSchema.index({ group: 1, user: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

// Static methods
groupRequestSchema.statics.createRequest = async function(groupId, userId) {
  return await this.create({ group: groupId, user: userId });
};

groupRequestSchema.statics.findByGroup = async function(groupId) {
  return await this.find({ group: groupId, status: 'pending' })
    .populate('user', 'id name email')
    .populate('group', 'id name')
    .sort({ createdAt: -1 });
};

groupRequestSchema.statics.findByUser = async function(userId) {
  return await this.find({ user: userId })
    .populate('group', 'id name description createdBy')
    .sort({ createdAt: -1 });
};

groupRequestSchema.statics.approveRequest = async function(requestId) {
  const request = await this.findById(requestId);
  if (!request || request.status !== 'pending') return null;

  request.status = 'approved';
  request.respondedAt = new Date();
  await request.save();

  // Add user to group
  const Group = mongoose.model('Group');
  await Group.addMember(request.group, request.user);

  return request;
};

groupRequestSchema.statics.rejectRequest = async function(requestId) {
  const request = await this.findById(requestId);
  if (!request || request.status !== 'pending') return null;

  request.status = 'rejected';
  request.respondedAt = new Date();
  await request.save();

  return request;
};

const GroupRequest = mongoose.model('GroupRequest', groupRequestSchema);

module.exports = GroupRequest;