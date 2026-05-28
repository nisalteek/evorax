const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleSinhala: { type: String },
  content: { type: String, required: true },
  contentSinhala: { type: String },
  type: { type: String, enum: ['general', 'urgent', 'event', 'result', 'holiday'], default: 'general' },
  priority: { type: Number, default: 0 },
  targetAudience: [{ type: String, enum: ['all', 'students', 'teachers', 'parents'] }],
  expiresAt: { type: Date },
  isPinned: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const feedbackSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true, maxlength: 500 },
  aspects: {
    organization: { type: Number, min: 1, max: 5 },
    content: { type: Number, min: 1, max: 5 },
    venue: { type: Number, min: 1, max: 5 }
  },
  isApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Announcement: mongoose.model('Announcement', announcementSchema),
  Feedback: mongoose.model('Feedback', feedbackSchema),
  Contact: mongoose.model('Contact', contactSchema)
};
