const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

// Get all events (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status, featured, search, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status) filter.status = status;
    if (featured) filter.featured = featured === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleSinhala: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');

    res.json({ success: true, events, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get upcoming events for countdown
router.get('/upcoming', async (req, res) => {
  try {
    const events = await Event.find({
      status: { $in: ['upcoming', 'ongoing'] },
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5).select('title titleSinhala date time venue image category');
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get featured events
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.find({ featured: true, status: { $in: ['upcoming', 'ongoing'] } })
      .sort({ date: 1 }).limit(6);
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single event
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create event (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const event = new Event({ ...req.body, createdBy: req.user._id });
    await event.save();
    res.status(201).json({ success: true, message: 'Event created successfully', event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update event (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event updated', event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add live update (admin only)
router.post('/:id/live-update', adminAuth, async (req, res) => {
  try {
    const { message, type } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $push: { liveUpdates: { message, type, timestamp: new Date() } } },
      { new: true }
    );
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete event (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
