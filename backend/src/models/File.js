const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storageName: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  url: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
