const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
