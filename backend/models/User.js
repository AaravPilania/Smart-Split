const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  googleId: { type: String, sparse: true },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  pfp: { type: String, default: '' },
  upiId: { type: String, default: '' },
  monthlyBudget: { type: Number, default: 0 }, // 0 = no budget set
  refreshTokenHash: { type: String, select: false, default: null },
  refreshTokenExpiry: { type: Date, default: null },
  isPremium: { type: Boolean, default: false },
  premiumExpiry: { type: Date, default: null },
  dailyOcrCount: { type: Number, default: 0 },
  dailyOcrDate: { type: String, default: '' },
}, { timestamps: true });

userSchema.methods.checkPremium = function() {
  if (!this.isPremium) return false;
  if (this.premiumExpiry && new Date(this.premiumExpiry) < new Date()) {
    this.isPremium = false;
    this.premiumExpiry = null;
    this.save().catch(() => {});
    return false;
  }
  return true;
};

userSchema.methods.canUseOcr = function() {
  const today = new Date().toISOString().split('T')[0];
  if (this.checkPremium()) return { allowed: true, remaining: Infinity };
  if (this.dailyOcrDate !== today) {
    this.dailyOcrCount = 0;
    this.dailyOcrDate = today;
  }
  const FREE_LIMIT = 5;
  return { allowed: this.dailyOcrCount < FREE_LIMIT, remaining: FREE_LIMIT - this.dailyOcrCount, limit: FREE_LIMIT };
};

userSchema.methods.incrementOcr = async function() {
  const today = new Date().toISOString().split('T')[0];
  if (this.dailyOcrDate !== today) {
    this.dailyOcrCount = 0;
    this.dailyOcrDate = today;
  }
  this.dailyOcrCount += 1;
  await this.save();
};

const UserModel = mongoose.model('User', userSchema);

function doc2obj(doc) {
  if (!doc) return null;
  const plain = JSON.parse(JSON.stringify(
    doc.toObject ? doc.toObject({ virtuals: true }) : doc
  ));
  if (!plain.id && plain._id) plain.id = plain._id;
  return plain;
}

// Escape special regex characters to prevent regex injection
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    return { _id: user._id.toString(), id: user._id.toString(), email: user.email, name: user.name, username: user.username, pfp: '' };
  },

  async createWithGoogle({ email, name, googleId, pfp = '' }) {
    const username = await generateUniqueUsername(name || 'user');
    const user = await UserModel.create({
      email: email.toLowerCase().trim(),
      name: name ? name.trim() : '',
      googleId,
      pfp,
      username,
    });
    return { _id: user._id.toString(), id: user._id.toString(), email: user.email, name: user.name, username: user.username, pfp: user.pfp || '' };
  },

  async findByGoogleId(googleId) {
    return doc2obj(await UserModel.findOne({ googleId }).select('-password'));
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
    const escaped = escapeRegex(emailPattern);
    // Prefix matches first, then contains
    const startsWith = await UserModel
      .find({ email: { $regex: `^${escaped}`, $options: 'i' } }, 'name email username pfp')
      .limit(limit)
      .lean();
    if (startsWith.length >= limit) return startsWith.map(doc2obj);
    const ids = startsWith.map((u) => u._id);
    const contains = await UserModel
      .find({ email: { $regex: escaped, $options: 'i' }, _id: { $nin: ids } }, 'name email username pfp')
      .limit(limit - startsWith.length)
      .lean();
    return [...startsWith, ...contains].map(doc2obj);
  },

  async searchByUsername(usernamePattern, limit = 10) {
    const escaped = escapeRegex(usernamePattern);
    // Prefix matches first, then contains
    const startsWith = await UserModel
      .find({ username: { $regex: `^${escaped}`, $options: 'i' } }, 'name email username pfp')
      .limit(limit)
      .lean();
    if (startsWith.length >= limit) return startsWith.map(doc2obj);
    const ids = startsWith.map((u) => u._id);
    const contains = await UserModel
      .find({ username: { $regex: escaped, $options: 'i' }, _id: { $nin: ids } }, 'name email username pfp')
      .limit(limit - startsWith.length)
      .lean();
    return [...startsWith, ...contains].map(doc2obj);
  },

  async updateById(id, updates) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const setFields = {};
    if (updates.name !== undefined) setFields.name = updates.name.trim();
    if (updates.email !== undefined) setFields.email = updates.email.toLowerCase().trim();
    if (updates.password !== undefined) setFields.password = await bcrypt.hash(updates.password, 10);
    if (updates.username !== undefined) setFields.username = updates.username.toLowerCase().trim();
    if (updates.pfp !== undefined) setFields.pfp = updates.pfp;
    if (updates.upiId !== undefined) setFields.upiId = updates.upiId.trim();
    if (updates.monthlyBudget !== undefined) setFields.monthlyBudget = Math.max(0, Number(updates.monthlyBudget) || 0);
    if (updates.googleId !== undefined) setFields.googleId = updates.googleId;
    if (updates.refreshTokenHash !== undefined) setFields.refreshTokenHash = updates.refreshTokenHash;
    if (updates.refreshTokenExpiry !== undefined) setFields.refreshTokenExpiry = updates.refreshTokenExpiry;
    await UserModel.findByIdAndUpdate(id, { $set: setFields });
    return this.findById(id);
  },

  async findByRefreshHash(hash) {
    if (!hash) return null;
    return doc2obj(await UserModel.findOne({ refreshTokenHash: hash }).select('+refreshTokenHash +refreshTokenExpiry'));
  },

  async findByUsername(username) {
    return doc2obj(await UserModel.findOne({ username: username.toLowerCase().trim() }).select('-password'));
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  // Expose the raw Mongoose model for instance methods (checkPremium, canUseOcr, etc.)
  Model: UserModel,
};