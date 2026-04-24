const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: String,
  fullMarks: { type: Number, default: 100 },
  passMarks: { type: Number, default: 33 },
  internal: { type: Number, default: 0 },
  theory: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  marksInWords: String // e.g., "SEVEN TWO"
});

const marksheetSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, required: true },
  photoUrl: String, // For student photo

  fatherName: String,
  motherName: String,
  instituteName: { type: String, required: true },

  class: { type: String, required: true },
  rollNumber: String,
  examYear: String, // e.g., "2018 (ANNUAL)"
  issueDate: { type: String }, // e.g., "26/06/2018"

  subjects: [subjectSchema],  

  totalFullMarks: Number,
  totalPassMarks: Number,
  aggregate: Number,
  division: String,

}, { timestamps: true });

module.exports = mongoose.model('Marksheet', marksheetSchema);