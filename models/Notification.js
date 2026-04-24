const mongoose = require('mongoose');
module.exports = mongoose.model('Notification', new mongoose.Schema({
  type: { type: String, enum: ['admission', 'payment', 'attendance', 'system'], required: true },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));