const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');
const FileModel = require('../models/File');
const Project = require('../models/Project');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_'));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(text\/|image\/|application\/pdf|application\/json|application\/javascript|application\/zip)/;
    cb(null, allowed.test(file.mimetype));
  }
});

function isProjectMember(project, userId) {
  return project && (project.owner.equals(userId) || project.members.some((member) => member.user && member.user.equals(userId)));
}

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Upload a file
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const { projectId } = req.body;
    const project = projectId ? await Project.findById(projectId) : null;
    if (!projectId || !isProjectMember(project, req.user._id)) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'You must be a member of the project to upload files' });
    }

    let fileUrl = `/uploads/${req.file.filename}`;
    let storageName = req.file.filename;
    let mimeType = req.file.mimetype;
    let size = req.file.size;

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'collabsphere-projects',
        resource_type: 'auto'
      });
      fileUrl = result.secure_url;
      storageName = result.public_id;
      mimeType = result.format ? `${result.resource_type}/${result.format}` : req.file.mimetype;
      size = result.bytes || req.file.size;
      fs.unlinkSync(req.file.path);
    }

    const fileDoc = new FileModel({
      originalName: req.file.originalname,
      storageName,
      mimeType,
      size,
      url: fileUrl,
      project: projectId || null,
      uploadedBy: req.user._id
    });
    await fileDoc.save();

    if (projectId) {
      try {
        project.files = project.files || [];
        if (!project.files.some((id) => id.toString() === fileDoc._id.toString())) {
          project.files.push(fileDoc._id);
          await project.save();
        }
      } catch (e) {
        console.error('Error linking file to project:', e);
      }
    }

    try {
      const Contribution = require('../models/Contribution');
      const contrib = new Contribution({ project: projectId || null, user: req.user._id, type: 'file:upload', meta: { fileId: fileDoc._id } });
      await contrib.save();
    } catch (e) {
      console.error('Error recording contribution for file upload:', e);
    }

    res.json(fileDoc);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// List files for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });
    const files = await FileModel.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    const project = await Project.findById(file.project);
    if (!isProjectMember(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a member of this project' });

    if (isCloudinaryConfigured && file.storageName && !file.url?.startsWith('/uploads/')) {
      await cloudinary.uploader.destroy(file.storageName, { resource_type: file.mimeType?.startsWith('image/') ? 'image' : 'raw' });
    } else if (file.storageName) {
      const localPath = path.join(uploadDir, file.storageName);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    await FileModel.deleteOne({ _id: file._id });
    if (project) {
      project.files = (project.files || []).filter((id) => id.toString() !== file._id.toString());
      await project.save();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
