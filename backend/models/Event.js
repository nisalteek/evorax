const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  titleSinhala: { type: String, trim: true },
  description: { type: String, required: true },
  descriptionSinhala: { type: String },
  category: {
    type: String,
    enum: ['debate', 'sports', 'exhibition', 'cultural', 'academic', 'music', 'drama', 'science', 'other'],
    required: true
  },
  date: { type: Date, required: true },
  endDate: { type: Date },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  venueSinhala: { type: String },
  location: {
    address: { type: String },
    city: { type: String, default: 'කොළඹ' },
    mapUrl: { type: String }
  },
  organizer: { type: String, required: true },
  capacity: { type: Number, default: 100 },
  registeredCount: { type: Number, default: 0 },
  ticketPrice: { type: Number, default: 0 },
  currency: { type: String, default: 'LKR' },
  image: { type: String, default: '' },
  gallery: [{ type: String }],
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  featured: { type: Boolean, default: false },
  registrationDeadline: { type: Date },
  requirements: { type: String },
  prizes: [{ place: String, prize: String }],
  liveUpdates: [{
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['info', 'highlight', 'result', 'announcement'], default: 'info' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

eventSchema.virtual('isFull').get(function() {
  return this.registeredCount >= this.capacity;
});

eventSchema.virtual('spotsLeft').get(function() {
  return Math.max(0, this.capacity - this.registeredCount);
});

module.exports = mongoose.model('Event', eventSchema);
