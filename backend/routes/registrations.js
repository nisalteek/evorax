const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth, adminAuth } = require('../middleware/auth');

// Register for an event
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, ticketType, specialRequirements, attendeePhone, attendeeGrade } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status === 'completed' || event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Registration closed for this event' });
    }
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is fully booked' });
    }
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ success: false, message: 'Registration deadline passed' });
    }

    const existing = await Registration.findOne({ user: req.user._id, event: eventId });
    if (existing) return res.status(400).json({ success: false, message: 'Already registered for this event' });

    const registration = new Registration({
      user: req.user._id,
      event: eventId,
      ticketType: ticketType || 'general',
      attendeeName: req.user.name,
      attendeeEmail: req.user.email,
      attendeePhone: attendeePhone || req.user.phone,
      attendeeGrade: attendeeGrade || req.user.grade,
      amountPaid: event.ticketPrice,
      paymentStatus: event.ticketPrice === 0 ? 'free' : 'pending',
      specialRequirements
    });

    // Generate QR code
    const qrData = JSON.stringify({
      ticketId: registration.ticketId,
      event: event.title,
      attendee: req.user.name,
      date: event.date
    });
    registration.qrCode = await QRCode.toDataURL(qrData, {
      width: 300,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    await registration.save();

    // Update event count and user's registered events
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      registration
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Already registered' });
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's registrations
router.get('/my', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event', 'title titleSinhala date time venue image category status')
      .sort({ registeredAt: -1 });
    res.json({ success: true, registrations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Check registration status for an event
router.get('/check/:eventId', auth, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user._id,
      event: req.params.eventId
    });
    res.json({ success: true, registered: !!registration, registration });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cancel registration - DELETE method (for users and admins)
router.delete('/:id', auth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    
    // Check if user owns this registration OR is admin
    const isOwner = registration.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this registration' });
    }
    
    // Check if event is already completed
    const event = await Event.findById(registration.event);
    if (event && event.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel registration for completed event' });
    }
    
    // Store event ID before deleting
    const eventId = registration.event;
    
    await registration.deleteOne();
    
    // Decrease registered count in event
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
    
    res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all registrations for an event (admin)
router.get('/event/:eventId', adminAuth, async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('user', 'name email grade')
      .sort({ registeredAt: -1 });
    res.json({ success: true, registrations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;