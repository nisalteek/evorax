const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { Announcement, Feedback, Contact } = require('../models/Others');
const { auth, adminAuth } = require('../middleware/auth');

// Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [users, events, registrations, upcoming, contacts] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Event.countDocuments(),
      Registration.countDocuments({ status: { $ne: 'cancelled' } }),
      Event.countDocuments({ status: 'upcoming' }),
      Contact.countDocuments({ status: 'new' })
    ]);

    const recentEvents = await Event.find().sort({ createdAt: -1 }).limit(5).select('title date status registeredCount');
    const recentUsers = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5).select('name email role createdAt');

    res.json({
      success: true,
      stats: { users, events, registrations, upcoming, contacts },
      recentEvents,
      recentUsers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter).select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));

    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle user status
router.put('/users/:id/toggle', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Change user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all contacts
router.get('/contacts', adminAuth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark contact as read
router.put('/contacts/:id', adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status: 'read' }, { new: true });
    res.json({ success: true, contact });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all feedback
router.get('/feedback', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('event', 'title').populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Check in attendee
router.put('/checkin/:registrationId', adminAuth, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.registrationId);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    reg.checkedIn = true;
    reg.checkedInAt = new Date();
    reg.status = 'attended';
    await reg.save();
    res.json({ success: true, message: 'Checked in successfully', registration: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last admin user' });
      }
    }
    
    // Also delete all registrations by this user
    await Registration.deleteMany({ user: user._id });
    
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;