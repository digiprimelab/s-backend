const express = require('express');
const router = express.Router();
const StudyMaterial = require('../models/StudyMaterial');
const auth = require('../middleware/auth');
const bucket = require('../config/firebase');

// Public: Get All
router.get('/', async (req, res) => {
  try {
    const materials = await StudyMaterial.find().sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Upload
router.post('/', auth, async (req, res) => {
  try {
    const { title, class: className, subject, description, fileUrl } = req.body;

    if (!title || !className) {
      return res.status(400).json({ message: 'Title and Class are required' });
    }

    const material = new StudyMaterial({
      title,
      class: className,
      subject,
      description,
      fileUrl: fileUrl || ''
    });

    await material.save();
    res.json(material);
  } catch (err) {
    console.error('Study Material Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Admin: Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;