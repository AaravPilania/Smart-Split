const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const GroupModel = mongoose.model('Group', groupSchema);

const POPULATE_GROUP = [
  { path: 'createdBy', select: 'name email' },
  { path: 'members', select: 'name email upiId' }
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
  async createGroup(name, description, createdById) {
    const group = await GroupModel.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: createdById,
      members: [createdById]
    });
    return this.findByIdPopulated(group._id.toString());
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return doc2obj(await GroupModel.findById(id));
  },

  async findByIdPopulated(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return doc2obj(await GroupModel.findById(id).populate(POPULATE_GROUP));
  },

  async findByUser(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const groups = await GroupModel.find({ members: userId }).populate(POPULATE_GROUP).sort({ createdAt: -1 });
    return groups.map(doc2obj);
  },

  async findAll() {
    const groups = await GroupModel.find().populate(POPULATE_GROUP).sort({ createdAt: -1 });
    return groups.map(doc2obj);
  },

  async isMember(groupId, userId) {
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) return false;
    return !!(await GroupModel.findOne({ _id: groupId, members: userId }));
  },

  async addMember(groupId, userId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
    await GroupModel.findByIdAndUpdate(groupId, { $addToSet: { members: userId } });
    return this.findByIdPopulated(groupId);
  },

  async addMembers(groupId, userIds) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
    await GroupModel.findByIdAndUpdate(groupId, { $addToSet: { members: { $each: userIds } } });
    return this.findByIdPopulated(groupId);
  },

  async deleteById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await GroupModel.findByIdAndDelete(id);
    return !!result;
  }
};
