const express = require('express');
const router = express.Router();
const { Announcement } = require('../models/Others');
const { adminAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }]
    }).sort({ isPinned: -1, priority: -1, createdAt: -1 }).limit(20);
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const ann = new Announcement({ ...req.body, createdBy: req.user._id });
    await ann.save();
    res.status(201).json({ success: true, announcement: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, announcement: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
