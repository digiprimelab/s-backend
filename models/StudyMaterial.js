const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  class: { type: String, required: true },
  subject: String,
  description: String,
  fileUrl: String,
  fileName: String,
  uploadedBy: { type: String, default: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);