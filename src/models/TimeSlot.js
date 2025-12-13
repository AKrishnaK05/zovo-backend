const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  // Worker this slot belongs to (null = system default)
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Date of availability
  date: {
    type: Date,
    required: true
  },
  // Time slots for this date
  slots: [{
    time: {
      type: String, // "09:00", "10:00", etc.
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    // If booked, reference to job
    bookedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null
    },
    // Price modifier for this specific slot (optional)
    priceModifier: {
      type: Number,
      default: 1.0 // 1.0 = no change, 1.2 = 20% higher
    }
  }],
  // Service categories this slot applies to
  categories: [{
    type: String
  }]
}, { timestamps: true });

// Compound index for efficient queries
timeSlotSchema.index({ date: 1, worker: 1 });
timeSlotSchema.index({ 'slots.isAvailable': 1, date: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);