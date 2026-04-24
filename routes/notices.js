const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const auth = require('../middleware/auth');
const bucket = require('../config/firebase');

// Get all notices (Public)
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ publishedDate: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create notice (Admin)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, fileUrl } = req.body;
    
    const notice = new Notice({ title, description, fileUrl });
    await notice.save();
    
    res.json({ message: 'Notice created successfully', notice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload PDF to Firebase ✅ WITH SAFETY CHECK
router.post('/upload-pdf', auth, async (req, res) => {
  try {
    // Check if Firebase is configured
    if (!bucket) {
      return res.status(500).json({ 
        message: 'Firebase storage not configured. Please set up Firebase credentials.' 
      });
    }

    const { base64File, fileName } = req.body;
    
    // Handle different base64 prefixes
    const base64Data = base64File.replace(/^data:application\/pdf;base64,/, '')
                                  .replace(/^application\/pdf;base64,/, '');
    
    const buffer = Buffer.from(base64Data, 'base64');
    const file = bucket.file(`notices/${Date.now()}-${fileName}`);
    
    await file.save(buffer, {
      metadata: { contentType: 'application/pdf' },
      public: true
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    res.json({ fileUrl: publicUrl });
  } catch (err) {
    console.error('PDF Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete notice
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;