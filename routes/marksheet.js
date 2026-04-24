const express = require('express');
const router = express.Router();
const Marksheet = require('../models/marksheet');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Configure multer to use /tmp directory for Vercel serverless
const upload = multer({ dest: '/tmp/' });

// Helper function to parse CSV
const parsecsv = (filepath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!filepath) return resolve(results);
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// Helper: Convert number to digit-by-digit words (e.g., 72 -> "SEVEN TWO")
const digitToWords = (num) => {
  const words = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  return num.toString().split('').map(digit => words[parseInt(digit)] || digit).join(' ');
};

// Get all marksheets
router.get('/', async (req, res) => {
  try {
    const marksheets = await Marksheet.find().sort({ createdAt: -1 });
    res.json(marksheets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marksheets' });
  }
});

// Create a new marksheet
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filepath = req.file ? req.file.path : null;
    if (!filepath) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }
    
    const rows = await parsecsv(filepath);

    const data = rows.map(row => {
        // Helper to get value from row case-insensitively
        const getVal = (name) => {
            const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
            return key ? row[key] : '';
        };

        const subjects = [
            { name: "Math", theory: Number(getVal('math') || 0) },
            { name: "Science", theory: Number(getVal('science') || 0) },
            { name: "English", theory: Number(getVal('english') || 0) },
            { name: "Hindi", theory: Number(getVal('hindi') || 0) },
            { name: "Social Science", theory: Number(getVal('socialscience') || 0) }
        ].map(s => ({
            ...s,
            internal: Number(getVal(`${s.name.replace(' ', '').toLowerCase()}_internal`) || 0),
            fullMarks: 100,
            passMarks: 33,
            total: s.theory + (Number(getVal(`${s.name.replace(' ', '').toLowerCase()}_internal`) || 0)),
            marksInWords: digitToWords(s.theory + (Number(getVal(`${s.name.replace(' ', '').toLowerCase()}_internal`) || 0)))
        }));
        
        const aggregate = subjects.reduce((sum, s) => sum + s.total, 0);
        const totalFullMarks = subjects.reduce((sum, s) => sum + s.fullMarks, 0);
        const totalPassMarks = subjects.reduce((sum, s) => sum + s.passMarks, 0);

        let division = "Fail";
        if (aggregate >= 300) division = "1st DIV.";
        else if (aggregate >= 225) division = "2nd DIV.";
        else if (aggregate >= 150) division = "3rd DIV.";

        return {
            studentName: getVal('studentName') || getVal('Name'),
            fatherName: getVal('fatherName') || getVal('Father'),
            motherName: getVal('motherName') || getVal('Mother'),
            rollNumber: getVal('roll') || getVal('rollNumber'),
            class: getVal('class'),
            instituteName: getVal('institute') || 'HIGH SCHOOL BIROIYARA PATNA',
            photoUrl: getVal('photoUrl'),
            examYear: getVal('examYear') || new Date().getFullYear().toString() + " (ANNUAL)",
            issueDate: getVal('issueDate') || new Date().toLocaleDateString('en-GB'),
            subjects,
            totalFullMarks,
            totalPassMarks,
            aggregate,
            division
        };
    });


    const validateRow = (row) => {
      const errors = [];

      if (!row.studentName || row.studentName.trim() === '') {
        errors.push('studentName missing');
      }

      if (!row.rollNumber) {
        errors.push('rollNumber missing');
      }

      if (isNaN(row.aggregate)) {
        errors.push('invalid aggregate');
      }

      return errors;
    };

    const validData = [];
    const invalidData = [];

    data.forEach((item, index) => {
      const errors = validateRow(item);

      if (errors.length > 0) {
        invalidData.push({
          row: index + 1,
          errors,
          data: item
        });
      } else {
        validData.push(item);
      }
    });

    if (validData.length > 0) {
      await Marksheet.insertMany(validData);
    }
    fs.unlinkSync(req.file.path);
    res.json({
      message: "Upload completed",
      saved: validData.length,
      failed: invalidData.length,
      errors: invalidData
    });
  } catch (error) {
    console.error('Error creating marksheet:', error);
    res.status(500).json({ error: 'Failed to create marksheet: ' + error.message });
  }
});

module.exports = router;
