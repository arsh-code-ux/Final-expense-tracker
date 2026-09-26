const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date }
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  budget: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [MemberSchema],
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  publicShareEnabled: { type: Boolean, default: false },
  publicShareToken: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
