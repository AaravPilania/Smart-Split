const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);

function doc2obj(doc) {
  if (!doc) return null;
  const plain = JSON.parse(JSON.stringify(
    doc.toObject ? doc.toObject({ virtuals: true }) : doc
  ));
  if (!plain.id && plain._id) plain.id = plain._id;
  return plain;
}

module.exports = {
  async create({ email, password, name }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name ? name.trim() : ''
    });
    return { _id: user._id.toString(), id: user._id.toString(), email: user.email, name: user.name };
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return doc2obj(await UserModel.findById(id).select('-password'));
  },

  async findByEmail(email, includePassword = false) {
    const query = UserModel.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) query.select('+password');
    return doc2obj(await query);
  },

  async search(emailPattern, limit = 10) {
    const users = await UserModel
      .find({ email: { $regex: emailPattern, $options: 'i' } }, 'name email')
      .limit(limit);
    return users.map(doc2obj);
  },

  async updateById(id, updates) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const setFields = {};
    if (updates.name !== undefined) setFields.name = updates.name.trim();
    if (updates.email !== undefined) setFields.email = updates.email.toLowerCase().trim();
    if (updates.password !== undefined) setFields.password = await bcrypt.hash(updates.password, 10);
    await UserModel.findByIdAndUpdate(id, { $set: setFields });
    return this.findById(id);
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};