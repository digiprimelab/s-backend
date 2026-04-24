const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Echo test
app.post('/test', (req, res) => {
  res.json({ received: req.body });
});

// Catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
