const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findById = function(id) {
  return this.findById(id);
};

userSchema.statics.create = function(email, password, name) {
  return this.create({ email, password, name });
};

userSchema.statics.update = async function(id, updates) {
  const user = await this.findById(id);
  if (!user) return null;

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      user[key] = updates[key];
    }
  });

  return await user.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
