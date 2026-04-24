const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const bucket = require('../config/firebase');
const sendEmail = require('../utils/email');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// ============================================
// 📥 SUBMIT ADMISSION FORM (Public)
// ============================================
router.post('/submit', async (req, res) => {
  try {
    const { studentName, parentName, mobile, previousClass, admissionClass, section, photoUrl, address, dob, aadharCard } = req.body;
    const portalPin = crypto.randomInt(100000, 999999).toString();

    const student = new Student({
      studentName,
      parentName,
      mobile,
      previousClass,
      admissionClass,
      section,
      photoUrl,
      address,
      dob,
      aadharCard,
      portalPin
    });

    await student.save();

    // Notify Admin (In-App)
    await Notification.create({
      type: 'admission',
      title: '🎓 New Admission',
      message: `${studentName.first} ${studentName.last} applied for ${admissionClass}`
    });

    // Email Admin
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: 'New Admission Application',
      html: `<h2>New Admission Received</h2>
             <p><b>Name:</b> ${studentName.first} ${studentName.last}</p>
             <p><b>Class:</b> ${admissionClass}</p>
             <p><b>Mobile:</b> ${mobile}</p>
             <p>Login to admin panel to review.</p>`
    });

    // Email Parent (Portal Access)
    await sendEmail({
      to: `${parentName.first.toLowerCase()}@email.com`, 
      subject: 'Your School Portal Access',
      html: `<h2>Welcome to School Portal</h2>
             <p>Your child's admission is received.</p>
             <p><b>Portal PIN:</b> ${portalPin}</p>
             <p>Use this PIN with your mobile number to login at /parent/login</p>`
    });

    res.json({ 
      message: 'Admission submitted successfully! Check email for Portal PIN.', 
      student,
      portalPin 
    });

  } catch (err) {
    console.error('Admission error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// 📋 GET ALL ADMISSIONS (Admin)
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// 📤 UPLOAD PHOTO TO FIREBASE (Admin)
// ============================================
router.post('/upload-photo', auth, async (req, res) => {
  try {
    // Check if Firebase is configured
    if (!bucket) {
      return res.status(500).json({ 
        message: 'Firebase storage not configured. Please set up Firebase credentials.' 
      });
    }

    const { base64Image, fileName } = req.body;
    
    const buffer = Buffer.from(base64Image.replace(/^image\/\w+;base64,/, ''), 'base64');
    const file = bucket.file(`photos/${Date.now()}-${fileName}`);
    
    await file.save(buffer, {
      metadata: { contentType: 'image/jpeg' },
      public: true
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    res.json({ photoUrl: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// ✏️ UPDATE STUDENT (Admin) - EDIT FEATURE
// ============================================
router.put('/:id', auth, async (req, res) => {
  try {
    const { studentName, parentName, mobile, email, gender, dob, address, aadharCard, admissionClass, section, rollNumber, photoUrl } = req.body;
    
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { 
        studentName, 
        parentName, 
        mobile, 
        email,
        gender,
        dob,
        address,
        aadharCard,
        admissionClass, 
        section,
        rollNumber,
        photoUrl
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ 
      message: 'Student updated successfully',
      student: updatedStudent 
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// 🗑️ DELETE STUDENT (Admin) - DELETE FEATURE
// ============================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    
    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ 
      message: 'Student deleted successfully',
      studentId: deletedStudent._id 
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// 🔍 SEARCH STUDENT BY ROLL NUMBER (Public)
// ============================================
router.get('/search', async (req, res) => {
  try {
    const { roll, class: className } = req.query;
    
    let query = {};
    if (roll) query.rollNumber = roll;
    if (className) query.admissionClass = className;
    
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;