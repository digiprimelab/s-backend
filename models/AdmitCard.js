const mongoose = require('mongoose');
module.exports = mongoose.model('AdmitCard', new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, required: true },
  fatherName: { type: String },
  roll: { type: String, required: true },
  class: { type: String, required: true },
  photoUrl: { type: String },
  examSession: { type: String, default: 'Annual' },
  createdAt: { type: Date, default: Date.now }
}));