const express = require('express');
const auth = require('../middleware/auth');
const Contribution = require('../models/Contribution');
const Project = require('../models/Project');
const Note = require('../models/Note');
const FileModel = require('../models/File');
const router = express.Router();

function isProjectMember(project, userId) {
  return project && (project.owner.equals(userId) || project.members.some((member) => member.user && member.user.equals(userId)));
}

// Return contribution counts grouped by user and type for a project
router.get('/contributions/project/:projectId', auth, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });
    const pipeline = [
      { $match: { project: require('mongoose').Types.ObjectId(projectId) } },
      { $group: { _id: { user: '$user', type: '$type' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.user', events: { $push: { type: '$_id.type', count: '$count' } }, total: { $sum: '$count' } } }
    ];
    const results = await Contribution.aggregate(pipeline);
    res.json(results);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple listing of recent contributions (admin/member)
router.get('/contributions/recent/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });
    const recent = await Contribution.find({ project: req.params.projectId }).sort({ createdAt: -1 }).limit(50).populate('user', 'name email');
    res.json(recent);
  } catch (err) {
    console.error('Analytics recent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/contributions/overview', auth, async (req, res) => {
  try {
    const projects = await Project.find({ $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] }).select('_id name description members updatedAt').lean();
    const projectIds = projects.map((project) => project._id);
    const summary = await Contribution.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const recent = await Contribution.find({ project: { $in: projectIds } })
      .sort({ createdAt: -1 }).limit(12).populate('user', 'name').populate('project', 'name');
    const [notes, files] = await Promise.all([
      Note.find({ project: { $in: projectIds } }).sort({ updatedAt: -1 }).limit(12).select('title project author updatedAt createdAt').populate('author', 'name').populate('project', 'name').lean(),
      FileModel.find({ project: { $in: projectIds } }).sort({ createdAt: -1 }).limit(12).select('originalName mimeType size url project uploadedBy createdAt').populate('uploadedBy', 'name').populate('project', 'name').lean()
    ]);
    const counts = await Promise.all(projects.map(async (project) => ({
      projectId: project._id,
      notes: await Note.countDocuments({ project: project._id }),
      files: await FileModel.countDocuments({ project: project._id }),
      members: project.members?.length || 0
    })));
    res.json({ projects, summary, recent, notes, files, counts });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
