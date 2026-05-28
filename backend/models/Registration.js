const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketId: { type: String, unique: true, default: () => `VID-${uuidv4().split('-')[0].toUpperCase()}` },
  ticketType: { type: String, enum: ['general', 'vip', 'student', 'teacher'], default: 'general' },
  status: { type: String, enum: ['confirmed', 'pending', 'cancelled', 'attended'], default: 'confirmed' },
  qrCode: { type: String },
  attendeeName: { type: String, required: true },
  attendeeEmail: { type: String, required: true },
  attendeePhone: { type: String },
  attendeeGrade: { type: String },
  amountPaid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'free', 'pending'], default: 'free' },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  certificateGenerated: { type: Boolean, default: false },
  specialRequirements: { type: String },
  registeredAt: { type: Date, default: Date.now }
});

registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
