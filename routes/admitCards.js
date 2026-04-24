const express = require('express');
const router = express.Router();
const AdmitCard = require('../models/AdmitCard');
const auth = require('../middleware/auth');

// Public Search
router.get('/search', async (req, res) => {
  try {
    const { roll, class: className } = req.query;
    const query = {};
    if (roll) query.roll = roll;
    if (className) query.class = className;

    // 1. Try to find an explicit Admit Card (Admin uploaded)
    let cards = await AdmitCard.find(query);

    // 2. Fallback: Search the Student collection if no specific admit card exists
    if (cards.length === 0) {
      const Student = require('../models/Student');
      const studentQuery = {};
      
      // Flexible Roll Number matching (handles '2' vs '02')
      if (roll) {
        studentQuery.rollNumber = { $regex: `^0*${roll}$` };
      }
      
      if (className) studentQuery.admissionClass = className;

      const students = await Student.find(studentQuery);
      console.log('DEBUG: Search found students:', students.length);
      if (students.length > 0) console.log('DEBUG: First student parentName:', students[0].parentName);
      
      cards = students.map(s => ({
        studentId: s._id,
        studentName: `${s.studentName.first} ${s.studentName.last}`,
        fatherName: s.parentName ? `${s.parentName.first} ${s.parentName.last}` : 'N/A',
        roll: s.rollNumber,
        class: s.admissionClass,
        photoUrl: s.photoUrl,
        examSession: 'Annual Examination',
        isDerived: true // Flag to indicate it's generated from registration
      }));
    }

    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Create/Upload Admit Cards
router.post('/', auth, async (req, res) => {
  try {
    const card = new AdmitCard(req.body);
    await card.save();
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;