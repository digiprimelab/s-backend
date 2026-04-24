const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { studentId, status, month, rollNumber } = req.query;
    let query = {};
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    if (month) query.month = month;
    if (rollNumber) query.rollNumber = rollNumber;
    const fees = await Fee.find(query).populate('studentId', 'studentName mobile rollNumber').sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { studentId, month, amount, dueDate } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let fee = await Fee.findOne({ studentId, month });
    if (fee) {
      fee.amount = amount;
      fee.dueDate = dueDate;
      await fee.save();
      return res.json(fee);
    }

    fee = new Fee({
      studentId,
      studentName: `${student.studentName.first} ${student.studentName.last}`,
      rollNumber: student.rollNumber,
      class: student.admissionClass,
      month,
      amount,
      dueDate: dueDate || new Date(new Date().setMonth(new Date().getMonth() + 1))
    });
    await fee.save();
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { status, paymentMethod, transactionId } = req.body;
    const fee = await Fee.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        paymentMethod, 
        transactionId, 
        paidAt: status === 'Paid' || status === 'Approved' ? new Date() : undefined 
      },
      { new: true }
    );
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/bulk-generate', auth, async (req, res) => {
  try {
    const { class: className, month, amount, dueDate } = req.body;
    const students = await Student.find({ admissionClass: className });
    const fees = [];
    for (const student of students) {
      const exists = await Fee.findOne({ studentId: student._id, month });
      if (!exists) {
        fees.push({
          studentId: student._id,
          studentName: `${student.studentName.first} ${student.studentName.last}`,
          rollNumber: student.rollNumber,
          class: className,
          month,
          amount,
          dueDate: dueDate || new Date(new Date().setMonth(new Date().getMonth() + 1)),
          status: 'Pending'
        });
      }
    }
    if (fees.length > 0) await Fee.insertMany(fees);
    res.json({ message: `Generated fees for ${fees.length} students` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;