const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const marksheetRoutes = require('./routes/marksheet');



dotenv.config();

const app = express(); 

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection ✅ FIXED - Removed deprecated options
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admission', require('./routes/admission'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/students', require('./routes/students'));
app.use('/api/results', require('./routes/results'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/parent', require('./routes/parent'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admit-cards', require('./routes/admitCards'));
app.use('/api/study-material', require('./routes/studyMaterial'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/teacher-attendance', require('./routes/teacherAttendance'));
app.use('/api/news-letter-subscriber',require('./routes/subscriber'));
app.use('/api/marksheets', marksheetRoutes);
// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '🚀 School Management API is running...',
    version: '1.0.0'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.url} - Route not found`
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
