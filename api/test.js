const express = require('express');
const cors = require('cors');

// Minimal test - no routes, no DB
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Test working' });
});

app.post('/test', (req, res) => {
  res.json({ received: req.body });
});

module.exports = app;
