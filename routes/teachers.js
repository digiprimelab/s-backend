const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find({}).sort({ 'studentName.last': 1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a teacher
// @route   POST /api/teachers
// @access  Private/Admin
router.post('/', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, subject, ...rest } = req.body;
    
    // Check if teacher exists
    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Teacher with this email already exists' });

    // Generate Employee ID if not provided
    const employeeId = req.body.employeeId || `TCH-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("Creating teacher with body:", req.body);
    console.log("Generated employeeId:", employeeId);

    const teacher = new Teacher({
      employeeId,
      studentName: { first: firstName, last: lastName },
      email,
      subject,
      ...rest
    });

    const saved = await teacher.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a teacher
// @route   PUT /api/teachers/:id
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    Object.assign(teacher, req.body);
    const updated = await teacher.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a teacher
// @route   DELETE /api/teachers/:id
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    await teacher.deleteOne();
    res.json({ message: 'Teacher removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
