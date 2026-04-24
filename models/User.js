const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Auth Fields
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Personal Info Fields
  name: {
    first: { type: String, trim: true },
    last: { type: String, trim: true }
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  dateOfBirth: { type: Date },
  userId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // System Fields
  role: {
    type: String,
    enum: ['admin', 'staff', 'teacher'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ FIXED: Hash password before saving (Mongoose 6+ async hook)
userSchema.pre('save', async function() {
  // Only hash if password is modified
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    // Throw error to stop save operation
    throw err;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.name?.first || ''} ${this.name?.last || ''}`.trim();
});

module.exports = mongoose.model('User', userSchema);