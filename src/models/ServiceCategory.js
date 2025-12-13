const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '🔧'
  },
  image: {
    type: String,
    default: ''
  },
  // Base pricing
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Price per hour for extended work
  hourlyRate: {
    type: Number,
    default: 0
  },
  // Minimum service duration in minutes
  minDuration: {
    type: Number,
    default: 60
  },
  // Service includes (for display)
  includes: [{
    type: String
  }],
  // Popular sub-services
  subServices: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, default: 30 }, // minutes
    description: { type: String, default: '' }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // For ordering in UI
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for fast lookups
serviceCategorySchema.index({ slug: 1 });
serviceCategorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);