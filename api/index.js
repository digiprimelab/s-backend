const express = require('express');
const cors = require('cors');

// Load environment variables from .env only in development
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

// Safe module loader
function safeRequire(modulePath, fallbackMessage) {
  try {
    return require(modulePath);
  } catch (err) {
    console.error(`❌ Failed to load ${modulePath}: ${err.message}`);
    const router = express.Router();
    router.all((req, res) => {
      res.status(500).json({ error: 'Service Unavailable', message: fallbackMessage });
    });
    return router;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global error handlers - log but don't crash
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

// Start DB connection immediately (non-blocking)
let dbConnected = false;
if (process.env.MONGODB_URI) {
  let connectToDatabase;
  try {
    connectToDatabase = require('./lib/db');
  } catch (err) {
    console.error('❌ Failed to load DB module:', err.message);
  }
  
  if (connectToDatabase) {
    connectToDatabase()
      .then(() => {
        dbConnected = true;
        console.log('✅ MongoDB Connected');
      })
      .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('⚠️  DB operations will fail until connection succeeds');
      });
  }
} else {
  console.warn('⚠️  MONGODB_URI not set - database disabled');
}

// Routes - loaded safely
app.use('/api/auth', safeRequire('./routes/auth', 'Auth service unavailable'));
app.use('/api/admission', safeRequire('./routes/admission', 'Admission service unavailable'));
app.use('/api/notices', safeRequire('./routes/notices', 'Notices service unavailable'));
app.use('/api/students', safeRequire('./routes/students', 'Students service unavailable'));
app.use('/api/results', safeRequire('./routes/results', 'Results service unavailable'));
app.use('/api/settings', safeRequire('./routes/settings', 'Settings service unavailable'));
app.use('/api/fees', safeRequire('./routes/fees', 'Fees service unavailable'));
app.use('/api/attendance', safeRequire('./routes/attendance', 'Attendance service unavailable'));
app.use('/api/parent', safeRequire('./routes/parent', 'Parent service unavailable'));
app.use('/api/notifications', safeRequire('./routes/notifications', 'Notifications service unavailable'));
app.use('/api/admit-cards', safeRequire('./routes/admitCards', 'Admit cards service unavailable'));
app.use('/api/study-material', safeRequire('./routes/studyMaterial', 'Study material service unavailable'));
app.use('/api/teachers', safeRequire('./routes/teachers', 'Teachers service unavailable'));
app.use('/api/teacher-attendance', safeRequire('./routes/teacherAttendance', 'Teacher attendance service unavailable'));
app.use('/api/news-letter-subscriber', safeRequire('./routes/subscriber', 'Subscriber service unavailable'));
app.use('/api/marksheets', safeRequire('./routes/marksheet', 'Marksheets service unavailable'));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: '🚀 API is running',
    dbConnected,
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Export
module.exports = app;
