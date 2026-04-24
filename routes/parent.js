const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Parent Login (Mobile + Portal PIN)
router.post('/login', async (req, res) => {
  try {
    const { mobile, portalPin } = req.body;
    const student = await Student.findOne({ mobile, portalPin });
    if (!student) return res.status(400).json({ message: 'Invalid mobile or PIN' });

    const token = jwt.sign({ id: student._id, role: 'parent' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      student: {
        id: student._id,
        name: `${student.studentName.first} ${student.studentName.last}`,
        class: student.admissionClass,
        rollNumber: student.rollNumber,
        mobile: student.mobile,
        photo: student.photoUrl
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// My Fees
router.get('/fees', auth, async (req, res) => {
  try {
    const { rollNumber } = req.query;
    let query = { studentId: req.user.id };
    if (rollNumber) {
      const student = await Student.findOne({ rollNumber });
      if (student) query = { rollNumber };
    }
    const fees = await Fee.find(query).sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search student fees by roll number (Public - no auth required)
router.get('/fees/search', async (req, res) => {
  try {
    const { rollNumber, name } = req.query;
    let student = null;
    if (rollNumber) {
      student = await Student.findOne({ rollNumber });
    }
    if (!student && name) {
      const nameParts = name.split(' ');
      student = await Student.findOne({
        'studentName.first': { $regex: new RegExp(nameParts[0], 'i') },
        'studentName.last': { $regex: new RegExp(nameParts[nameParts.length - 1], 'i') }
      });
    }
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    const fees = await Fee.find({ rollNumber: student.rollNumber }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search student by roll number or name (Public)
router.get('/student/search', async (req, res) => {
  try {
    const { rollNumber, name } = req.query;
    let student = null;
    if (rollNumber) {
      student = await Student.findOne({ rollNumber });
    }
    if (!student && name) {
      const nameParts = name.split(' ');
      student = await Student.findOne({
        'studentName.first': { $regex: new RegExp(nameParts[0], 'i') },
        'studentName.last': { $regex: new RegExp(nameParts[nameParts.length - 1], 'i') }
      });
    }
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({
      _id: student._id,
      studentName: student.studentName,
      admissionClass: student.admissionClass,
      rollNumber: student.rollNumber,
      mobile: student.mobile,
      photoUrl: student.photoUrl
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// My Attendance
router.get('/attendance', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ 'records.studentId': req.user.id }).sort({ date: -1 }).limit(30);
    const myData = records.map(r => {
      const rec = r.records.find(x => x.studentId.toString() === req.user.id);
      return { date: r.date, status: rec?.status || 'N/A', class: r.class };
    });
    res.json(myData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;