const express = require('express');
const router = express.Router();
const TeacherAttendance = require('../models/TeacherAttendance');
const auth = require('../middleware/auth');

// Get attendance for a specific date range
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate + "T00:00:00.000Z");
      if (endDate) query.date.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    const attendance = await TeacherAttendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save or Update Attendance for a specific date
router.post('/', auth, async (req, res) => {
  try {
    const { date, records } = req.body;
    
    // Robust date parsing
    const parseDateToUTC = (dateStr) => {
      if (!dateStr) return null;
      if (typeof dateStr !== 'string') return null;
      const trimmed = dateStr.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return new Date(trimmed + "T00:00:00Z");
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return null;
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return new Date(`${yr}-${mo}-${da}T00:00:00Z`);
    };

    const attendanceDate = parseDateToUTC(date);
    if (!attendanceDate) {
      return res.status(400).json({ message: 'Invalid date provided' });
    }

    const existing = await TeacherAttendance.findOne({ date: attendanceDate });
    if (existing) {
      existing.records = records;
      await existing.save();
      return res.json(existing);
    }

    const attendance = new TeacherAttendance({
      date: attendanceDate,
      records: records.map(r => ({
        teacherId: r.teacherId,
        teacherName: r.teacherName,
        employeeId: r.employeeId,
        status: r.status
      }))
    });
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
