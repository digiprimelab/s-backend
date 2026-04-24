const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const csv = require('csv-parser');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

// Export students to CSV
router.get('/export', auth, async (req, res) => {
  try {
    const students = await Student.find();
    
    const csvData = students.map(s => ({
      Name: `${s.studentName.first} ${s.studentName.last}`,
      Parent: `${s.parentName.first} ${s.parentName.last}`,
      Mobile: s.mobile,
      PreviousClass: s.previousClass,
      AdmissionClass: s.admissionClass,
      RollNumber: s.rollNumber || '',
      PhotoURL: s.photoUrl || ''
    }));

    const filePath = path.join(__dirname, '../temp/students.csv');
    
    const writer = csvWriter({
      path: filePath,
      header: [
        { id: 'Name', title: 'Name' },
        { id: 'Parent', title: 'Parent' },
        { id: 'Mobile', title: 'Mobile' },
        { id: 'PreviousClass', title: 'PreviousClass' },
        { id: 'AdmissionClass', title: 'AdmissionClass' },
        { id: 'RollNumber', title: 'RollNumber' },
        { id: 'PhotoURL', title: 'PhotoURL' }
      ]
    });

    await writer.writeRecords(csvData);
    res.download(filePath, 'students.csv');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Import students from CSV
router.post('/import', auth, async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ message: 'Invalid CSV data' });
    }

    const students = [];
    for (const row of csvData) {
      const nameParts = (row.Name || row.name || '').trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Student';

      const parentParts = (row.Parent || row.parent || '').trim().split(' ');
      const pFirstName = parentParts[0] || 'Unknown';
      const pLastName = parentParts.slice(1).join(' ') || 'Parent';

      students.push({
        studentName: { first: firstName, last: lastName },
        parentName: { first: pFirstName, last: pLastName },
        mobile: row.Mobile || row.mobile || '0000000000',
        previousClass: row.PreviousClass || row.previousclass || row.class || 'N/A',
        admissionClass: row.AdmissionClass || row.admissionclass || row.class || 'N/A',
        rollNumber: row.RollNumber || row.rollnumber || row.roll || '',
        portalPin: Math.random().toString(36).substring(2, 8).toUpperCase(),
        email: row.Email || row.email || ''
      });
    }
    
    await Student.insertMany(students);
    res.json({ message: `${students.length} students imported successfully!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all students - public for ID card download (no auth needed)
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all students (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update student (add roll number)
router.put('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;