const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentName: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  parentName: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  portalPin: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  email: { type: String },
  gender: { type: String },
  dob: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  aadharCard: { type: String },
  previousClass: { type: String, required: true },
  admissionClass: { type: String, required: true },
  section: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
  rollNumber: { type: String },
  photoUrl: { type: String },
  admissionDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);