const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Ramakrishna Vidya Mandir' },
  logoUrl: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  heroImages: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);