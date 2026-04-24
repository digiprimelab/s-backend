const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  studentName: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  photoUrl: { type: String },
  subject: { type: String, required: true },
  qualification: { type: String },
  bio: { type: String },
  status: { type: String, enum: ['active', 'on_leave', 'inactive'], default: 'active' },
  hireDate: { type: Date, default: Date.now },
  yearsExperience: { type: Number },
  tier: { type: String, enum: ['full_time', 'part_time', 'contract'], default: 'full_time' },
  assignedClasses: [{ type: String }],
  schedule: [{
    day: { type: String },
    period: { type: Number },
    className: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Teacher', teacherSchema);
