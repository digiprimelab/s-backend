const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  records: [{
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    employeeId: { type: String },
    teacherName: { type: String },
    status: { type: String, enum: ['Present', 'Absent', 'Holiday', 'Half-Day'], default: 'Present' }
  }],
  createdAt: { type: Date, default: Date.now }
});

teacherAttendanceSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
