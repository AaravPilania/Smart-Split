const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true }
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

async function generateUniqueUsername(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 20) || 'user';
  const exists = await UserModel.findOne({ username: base });
  if (!exists) return base;
  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    const candidate = `${base}_${suffix}`.slice(0, 25);
    const taken = await UserModel.findOne({ username: candidate });
    if (!taken) return candidate;
  }
  return `${base}_${Date.now()}`.slice(0, 25);
}

module.exports = {
  async create({ email, password, name }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = await generateUniqueUsername(name || 'user');
    const user = await UserModel.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name ? name.trim() : '',
      username,
    });
    return { _id: user._id.toString(), id: user._id.toString(), email: user.email, name: user.name, username: user.username };
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
      .find({ email: { $regex: emailPattern, $options: 'i' } }, 'name email username')
      .limit(limit);
    return users.map(doc2obj);
  },

  async updateById(id, updates) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const setFields = {};
    if (updates.name !== undefined) setFields.name = updates.name.trim();
    if (updates.email !== undefined) setFields.email = updates.email.toLowerCase().trim();
    if (updates.password !== undefined) setFields.password = await bcrypt.hash(updates.password, 10);
    if (updates.username !== undefined) setFields.username = updates.username.toLowerCase().trim();
    await UserModel.findByIdAndUpdate(id, { $set: setFields });
    return this.findById(id);
  },

  async findByUsername(username) {
    return doc2obj(await UserModel.findOne({ username: username.toLowerCase().trim() }).select('-password'));
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};