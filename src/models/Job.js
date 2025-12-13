// backend/src/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 1000
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 
      'appliance', 'other', 'ac-service', 'pest-control', 'salon', 
      'men-grooming', 'movers'
    ]
  },
  subServices: [{
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number, default: 1 }
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  // SIMPLIFIED location structure - easier to work with
  location: {
    address: { 
      type: String, 
      required: [true, 'Address is required'] 
    },
    city: { 
      type: String, 
      default: '' 
    },
    lat: { 
      type: Number,
      default: 0
    },
    lng: { 
      type: Number,
      default: 0
    }
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  timeSlot: {
    time: { type: String, default: '09:00' },
    endTime: { type: String, default: '10:00' }
  },
  estimatedPrice: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  customerNotes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  // Add this field to Job schema:
  hasReview: {
  type: Boolean,
  default: false
  }
}, { 
  timestamps: true 
});


jobSchema.index(
  { worker: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['accepted', 'in_progress'] } }
  }
);


// Prevent model recompilation error
module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);