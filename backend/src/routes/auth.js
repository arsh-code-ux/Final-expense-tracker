const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const jwtOptions = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };

// Register (simple)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!String(name || '').trim() || !normalizedEmail || !password || String(password).length < 8) {
      return res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required' });
    }
    let user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ message: 'User already exists' });
    user = new User({ name: String(name).trim(), email: normalizedEmail });
    await user.setPassword(password);
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, jwtOptions);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const valid = await user.validatePassword(password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, jwtOptions);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token endpoint
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to see all users and alerts
router.get('/debug-data', auth, async (req, res) => {
  try {
    const Alert = require('../models/Alert');
    
    const users = await User.find({}, 'name email _id');
    const alerts = await Alert.find({}).populate('userId', 'name email');
    
    res.json({
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email
      })),
      alerts: alerts.map(a => ({
        id: a._id,
        type: a.type,
        message: a.message,
        userId: a.userId._id,
        userName: a.userId.name,
        userEmail: a.userId.email,
        isRead: a.isRead
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate alerts for a specific user
router.post('/generate-alerts/:userId', auth, async (req, res) => {
  try {
    const Alert = require('../models/Alert');
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Clear existing alerts for this user
    await Alert.deleteMany({ userId: userId });
    
    // Generate various types of alerts
    const alertsToCreate = [
      {
        userId: userId,
        type: 'budget_exceeded',
        title: 'Budget Exceeded',
        message: 'You have exceeded your monthly Food budget by $150. Consider reviewing your spending habits.',
        severity: 'high'
      },
      {
        userId: userId,
        type: 'low_balance',
        title: 'Low Balance Alert',
        message: 'Your account balance is running low. Consider adding funds or reducing expenses.',
        severity: 'medium'
      },
      {
        userId: userId,
        type: 'no_savings',
        title: 'No Savings Detected',
        message: 'You haven\'t saved any money this month. Consider setting up a savings goal.',
        severity: 'medium'
      },
      {
        userId: userId,
        type: 'expense_trend',
        title: 'Rising Expense Trend',
        message: 'Your spending has increased by 25% compared to last month. Review your recent transactions.',
        severity: 'low'
      }
    ];
    
    // Create the alerts
    const createdAlerts = [];
    for (const alertData of alertsToCreate) {
      const alert = new Alert(alertData);
      await alert.save();
      createdAlerts.push(alert);
    }
    
    res.json({
      message: `Successfully created ${createdAlerts.length} alerts for ${user.name}`,
      user: { id: user._id, name: user.name, email: user.email },
      alerts: createdAlerts
    });
    
  } catch (error) {
    console.error('Error generating alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend server is running!', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

module.exports = router;
