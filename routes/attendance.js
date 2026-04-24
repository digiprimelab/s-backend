const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

const parseCSV = (filePath) => {
  const file = fs.readFileSync(filePath, 'utf8');

  const result = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase()
  });

  if (result.errors.length > 0) {
    throw new Error('CSV parsing error');
  }

  return result.data;
};


const Student = require('../models/Student');

router.post('/import', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const rows = parseCSV(req.file.path);
    const groups = {};
    const errors = [];

    const allStudents = await Student.find({}, '_id studentName rollNumber admissionClass');

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowClass = row.class || row.classname;
      const rowDateRaw = row.date;

      if (!rowClass || !rowDateRaw) {
        errors.push({ row: index + 1, message: 'Missing date or class in CSV' });
        continue;
      }

      const parseDateToUTC = (dateStr) => {
        if (!dateStr) return null;
        if (typeof dateStr !== 'string') return null;
        const trimmed = dateStr.trim();
        
        // Handle YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return new Date(trimmed + "T00:00:00Z");
        }
        
        // Handle M/D/YYYY or MM/DD/YYYY
        const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slashMatch) {
          const [_, m, d, y] = slashMatch;
          const yr = y;
          const mo = m.padStart(2, '0');
          const da = d.padStart(2, '0');
          return new Date(`${yr}-${mo}-${da}T00:00:00Z`);
        }

        const d = new Date(trimmed);
        if (isNaN(d.getTime())) return null;
        const yr = d.getUTCFullYear();
        const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
        const da = String(d.getUTCDate()).padStart(2, '0');
        return new Date(`${yr}-${mo}-${da}T00:00:00Z`);
      };

      const attendanceDate = parseDateToUTC(rowDateRaw);

      if (!attendanceDate) {
        errors.push({ row: index + 1, message: 'Invalid Date format in CSV' });
        continue;
      }

      const key = `${attendanceDate.getTime()}_${rowClass}`;

      if (!groups[key]) {
        groups[key] = {
          date: attendanceDate,
          class: rowClass,
          records: []
        };
      }

      const name = row.name || row.student || row['student name'] || row['studentname'];
      const roll = row.roll || row.rollno || row['roll no'] || row['roll number'] || row['rollnumber'] || row['roll_no'];
      const status = row.status || 'Present';
      const remark = row.remark || row.note || row.comment || '';

      if (!name && !roll) {
        errors.push({ row: index + 1, message: 'Missing student identifier (name or roll)' });
        continue;
      }

      // Try to find student
      let foundStudent = allStudents.find(s =>
        (s.admissionClass === rowClass) &&
        (
          (roll && s.rollNumber == roll) ||
          (name && `${s.studentName?.first} ${s.studentName?.last}`.toLowerCase() === name.toLowerCase())
        )
      );

      const rollStr = foundStudent?.rollNumber || roll;

      if (rollStr) {
        const existingInGroup = groups[key].records.find(r => String(r.rollNumber) === String(rollStr));
        if (existingInGroup) {
          errors.push({ row: index + 1, message: `Duplicate Roll Number ${rollStr} found in CSV for class ${rowClass}` });
          continue;
        }
      }

      groups[key].records.push({
        studentId: foundStudent ? foundStudent._id : null,
        studentName: foundStudent ? `${foundStudent.studentName?.first} ${foundStudent.studentName?.last}` : (name || (roll ? `Roll: ${roll}` : 'Unknown Student')),
        rollNumber: rollStr || null,
        status: status,
        remark: remark
      });
    }

    const savedGroups = Object.values(groups);

    for (const group of savedGroups) {
      const d = new Date(group.date);
      const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
      const existing = await Attendance.findOne({ 
        date: { $gte: startOfDay, $lte: new Date(startOfDay.getTime() + 86399999) }, 
        class: group.class 
      });
      if (existing) {
        const recordMap = {};
        existing.records.forEach(r => {
          if (r.studentId) recordMap[r.studentId.toString()] = r;
          else if (r.rollNumber) recordMap[`roll_${r.rollNumber}`] = r;
          else recordMap[r.studentName] = r;
        });

        group.records.forEach(r => {
          if (r.studentId) recordMap[r.studentId.toString()] = r;
          else if (r.rollNumber) recordMap[`roll_${r.rollNumber}`] = r;
          else recordMap[r.studentName] = r;
        });
        existing.records = Object.values(recordMap);
        await existing.save();
      } else {
        const doc = new Attendance({
          date: startOfDay,
          class: group.class,
          records: group.records
        });
        await doc.save();
      }
    }

    res.json({
      message: 'Import completed',
      saved: savedGroups.reduce((acc, g) => acc + g.records.length, 0),
      failed: errors.length,
      dates: [...new Set(Object.values(groups).map(g => g.date.toISOString().split('T')[0]))],
      errors
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { class: className, startDate, endDate } = req.query;
    let query = {};
    if (className) query.class = className;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate + "T00:00:00.000Z");
      if (endDate) query.date.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { date, class: className, records } = req.body;
    const d = new Date(date);
    const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));

    const existing = await Attendance.findOne({ 
      date: { $gte: startOfDay, $lte: new Date(startOfDay.getTime() + 86399999) }, 
      class: className 
    });

    if (existing) {
      existing.records = records;
      await existing.save();
      return res.json(existing);
    }

    const attendance = new Attendance({
      date: startOfDay,
      class: className,
      records: records.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        rollNumber: r.rollNumber,
        status: r.status,
        remark: r.remark
      }))
    });
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;