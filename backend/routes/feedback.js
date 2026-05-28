const express = require('express');
const router = express.Router();
const { Feedback } = require('../models/Others');
const { auth } = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { eventId, rating, comment, aspects } = req.body;
    const feedback = new Feedback({
      event: eventId, user: req.user._id,
      authorName: req.user.name, rating, comment, aspects
    });
    await feedback.save();
    res.status(201).json({ success: true, message: 'Thank you for your feedback!', feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/event/:eventId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ event: req.params.eventId, isApproved: true })
      .sort({ createdAt: -1 }).limit(20);
    const avg = feedback.reduce((a, b) => a + b.rating, 0) / (feedback.length || 1);
    res.json({ success: true, feedback, averageRating: Math.round(avg * 10) / 10, total: feedback.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
