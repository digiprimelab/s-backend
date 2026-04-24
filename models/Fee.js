const mongoose = require('mongoose');
const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: String,
  rollNumber: String,
  class: String,
  month: String,
  amount: Number,
  status: { type: String, enum: ['Pending', 'Pending Approval', 'Approved', 'Paid', 'Overdue'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Razorpay', 'UPI', 'Cash', 'Bank Transfer', 'Offline'] },
  transactionId: String,
  paidAt: Date,
  dueDate: Date
}, { timestamps: true });
module.exports = mongoose.model('Fee', feeSchema);