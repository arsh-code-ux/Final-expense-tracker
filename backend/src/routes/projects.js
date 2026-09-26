const express = require('express');
const crypto = require('crypto');
const Project = require('../models/Project');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { recordContribution } = require('../utils/contribution');

const router = express.Router();

function isProjectMember(project, userId) {
  return project.owner.equals(userId) || project.members.some((member) => member.user && member.user.equals(userId));
}

function isProjectOwner(project, userId) {
  return project.owner && project.owner.equals(userId);
}

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, budget, startDate, endDate } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Project name is required.' });
    }

    const owner = req.user._id;
    const project = new Project({
      name: String(name).trim(),
      description: description || '',
      budget: Number(budget || 0),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      owner,
      members: [{ user: owner, role: 'owner' }]
    });

    await project.save();
    await recordContribution(project._id, owner, 'project:create');
    res.status(201).json(project);
  } catch (err) {
    console.error('Project create error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({ $or: [{ owner: userId }, { 'members.user': userId }] }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Project list error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('notes')
      .populate('files');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectMember(project, userId)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });

    res.json(project);
  } catch (err) {
    console.error('Project fetch error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, budget, startDate, endDate } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectOwner(project, req.user._id)) return res.status(403).json({ message: 'Only the owner can edit this project' });

    if (name) project.name = String(name).trim();
    if (description !== undefined) project.description = String(description);
    if (budget !== undefined) project.budget = Number(budget || 0);
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) project.endDate = endDate ? new Date(endDate) : undefined;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Project update error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectOwner(project, req.user._id)) return res.status(403).json({ message: 'Only the owner can delete this project' });

    await project.deleteOne();
    await Transaction.deleteMany({ spaceId: project._id });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('Project delete error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/:id/members', auth, async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectOwner(project, req.user._id)) return res.status(403).json({ message: 'Only the owner can add members' });

    if (!email || !String(email).trim()) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (project.members.some((member) => member.user && member.user.equals(user._id))) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: user._id, role: role || 'member', invitedAt: Date.now() });
    await project.save();
    await recordContribution(project._id, req.user._id, 'member:add', { memberId: user._id });
    res.json(project);
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectOwner(project, req.user._id)) return res.status(403).json({ message: 'Only the owner can remove members' });

    const removeUserId = req.params.userId;
    const userExists = project.members.some((member) => member.user && member.user.toString() === removeUserId);
    if (!userExists) return res.status(404).json({ message: 'Member not found' });
    if (project.owner.toString() === removeUserId) return res.status(400).json({ message: 'Owner cannot be removed from project' });

    project.members = project.members.filter((member) => !(member.user && member.user.toString() === removeUserId));
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });

    res.json(project.members);
  } catch (err) {
    console.error('Fetch members error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/:id/public-share', auth, async (req, res) => {
  try {
    const { enable } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectOwner(project, req.user._id)) return res.status(403).json({ message: 'Only owner can change public share' });

    project.publicShareEnabled = !!enable;
    if (enable && !project.publicShareToken) {
      project.publicShareToken = crypto.randomBytes(16).toString('hex');
    }
    await project.save();
    res.json({ publicShareEnabled: project.publicShareEnabled, publicShareToken: project.publicShareToken });
  } catch (err) {
    console.error('Public share error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/public/:token', async (req, res) => {
  try {
    const project = await Project.findOne({ publicShareToken: req.params.token, publicShareEnabled: true }).populate('notes').populate('files');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ name: project.name, description: project.description, notes: project.notes, files: project.files, createdAt: project.createdAt });
  } catch (err) {
    console.error('Public fetch error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
