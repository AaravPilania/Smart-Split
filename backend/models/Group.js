const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Static methods
groupSchema.statics.create = async function(name, description, createdBy) {
  const group = await this.create({ name, description, createdBy });
  group.members.push(createdBy);
  return await group.save();
};

groupSchema.statics.findById = async function(id) {
  return await this.findById(id).populate('createdBy', 'id name email').populate('members', 'id name email');
};

groupSchema.statics.findByUser = async function(userId) {
  return await this.find({ members: userId }).populate('createdBy', 'id name email').populate('members', 'id name email');
};

groupSchema.statics.getMembers = async function(groupId) {
  const group = await this.findById(groupId);
  return group ? group.members : [];
};

groupSchema.statics.isMember = async function(groupId, userId) {
  const group = await this.findById(groupId);
  return group ? group.members.includes(userId) : false;
};

groupSchema.statics.addMember = async function(groupId, userId) {
  const group = await this.findById(groupId);
  if (!group) return false;

  if (!group.members.includes(userId)) {
    group.members.push(userId);
    await group.save();
    return true;
  }
  return false;
};

groupSchema.statics.addMembers = async function(groupId, userIds) {
  const group = await this.findById(groupId);
  if (!group) return false;

  userIds.forEach(userId => {
    if (!group.members.includes(userId)) {
      group.members.push(userId);
    }
  });

  await group.save();
  return true;
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
