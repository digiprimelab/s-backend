const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const auth = require('../middleware/auth');

// Search result (Public)
router.get('/search', async (req, res) => {
  try {
    const { roll, name } = req.query;
    
    let query = {};
    if (roll) query.roll = roll;
    if (name) query.name = new RegExp(name, 'i');
    
    const results = await Result.find(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create result (Admin)
router.post('/', auth, async (req, res) => {
  try {
    const { name, roll, class: className, marks } = req.body;
    
    if (!name || !roll || !className) {
      return res.status(400).json({ message: 'Name, roll and class are required' });
    }
    
    if (!marks || marks.length === 0) {
      return res.status(400).json({ message: 'At least one mark entry is required' });
    }
    
    const validMarks = marks.filter(m => m.subject && m.obtained > 0 && m.total > 0);
    
    if (validMarks.length === 0) {
      return res.status(400).json({ message: 'At least one valid mark entry is required' });
    }
    
    const totalMarks = validMarks.reduce((sum, m) => sum + m.total, 0);
    const obtainedMarks = validMarks.reduce((sum, m) => sum + m.obtained, 0);
    const percentage = (obtainedMarks / totalMarks) * 100;
    const resultStatus = percentage >= 33 ? 'Pass' : 'Fail';
    
    const resultDoc = new Result({
      name,
      roll,
      class: className,
      marks: validMarks,
      totalMarks,
      obtainedMarks,
      percentage: percentage.toFixed(2),
      result: resultStatus
    });
    
    await resultDoc.save();
    res.json({ message: 'Result saved successfully', result: resultDoc });
  } catch (err) {
    console.error('Result save error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all results (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update result (Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, roll, class: className, marks } = req.body;
    
    if (!marks || marks.length === 0) {
      return res.status(400).json({ message: 'At least one mark entry is required' });
    }
    
    const totalMarks = marks.reduce((sum, m) => sum + (m.total || 0), 0);
    const obtainedMarks = marks.reduce((sum, m) => sum + (m.obtained || 0), 0);
    
    if (totalMarks === 0) {
      return res.status(400).json({ message: 'Total marks cannot be zero' });
    }
    
    const percentage = (obtainedMarks / totalMarks) * 100;
    const resultStatus = percentage >= 33 ? 'Pass' : 'Fail';
    
    const resultDoc = await Result.findByIdAndUpdate(
      req.params.id,
      {
        name,
        roll,
        class: className,
        marks,
        totalMarks,
        obtainedMarks,
        percentage: percentage.toFixed(2),
        result: resultStatus
      },
      { new: true }
    );
    
    res.json({ message: 'Result updated successfully', result: resultDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete result (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ message: 'Result deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;