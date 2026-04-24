const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, required: true },
  class: { type: String, required: true },
  marks: [{
    subject: String,
    obtained: Number,
    total: Number
  }],
  totalMarks: Number,
  obtainedMarks: Number,
  percentage: Number,
  result: { type: String, enum: ['Pass', 'Fail'] }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);