const express = require('express');
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const Project = require('../models/Project');
const { recordContribution } = require('../utils/contribution');

const router = express.Router();

function isProjectMember(project, userId) {
  if (!project) return false;
  return project.owner.equals(userId) || project.members.some((member) => member.user && member.user.equals(userId));
}

router.post('/', auth, async (req, res) => {
  try {
    const { project: projectId, title, content, spaceId } = req.body;
    const effectiveProjectId = projectId || spaceId;

    if (!effectiveProjectId) return res.status(400).json({ message: 'Project ID is required' });

    const project = await Project.findById(effectiveProjectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });

    const note = new Note({
      title: title || 'Untitled note',
      content: content || '',
      project: effectiveProjectId,
      spaceId: effectiveProjectId,
      author: req.user._id,
      lastEditedBy: req.user._id
    });

    await note.save();
    project.notes.push(note._id);
    await project.save();
    await recordContribution(project._id, req.user._id, 'note:create', { noteId: note._id });
    res.status(201).json(note);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('notes');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });
    res.json(project.notes);
  } catch (err) {
    console.error('List notes error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('author', 'name email');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const project = await Project.findById(note.project || note.spaceId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });
    res.json(note);
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const project = await Project.findById(note.project || note.spaceId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });

    note.title = typeof title === 'string' ? title : note.title;
    note.content = typeof content === 'string' ? content : note.content;
    note.lastEditedBy = req.user._id;
    await note.save();
    await recordContribution(project._id, req.user._id, 'note:update', { noteId: note._id });
    res.json(note);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const project = await Project.findById(note.project || note.spaceId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });

    if (note.author && note.author.toString() !== req.user._id.toString() && !project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own notes unless you are the project owner' });
    }

    await Note.deleteOne({ _id: note._id });
    project.notes = project.notes.filter((id) => !id.equals(note._id));
    await project.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
