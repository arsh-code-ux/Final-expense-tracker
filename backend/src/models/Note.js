const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  content: { type: String, default: '' }, // markdown
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

NoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', NoteSchema);
