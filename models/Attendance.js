const mongoose = require('mongoose');
const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  class: { type: String, required: true },
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    rollNumber: String,
    status: { type: String, enum: ['Present', 'Absent', 'Holiday', 'Half-Day'], default: 'Present' },
    remark: { type: String }
  }]
}, { timestamps: true });
attendanceSchema.index({ date: 1, class: 1 }, { unique: true });
module.exports = mongoose.model('Attendance', attendanceSchema);