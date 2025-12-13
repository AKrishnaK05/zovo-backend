const mongoose = require('mongoose');

const serviceAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // City/region this area belongs to
  city: {
    type: String,
    required: true
  },
  // Polygon coordinates defining the area boundary
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of [lng, lat] pairs
      required: true
    }
  },
  // Center point for distance calculations
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  // Radius in kilometers (for circular areas)
  radius: {
    type: Number,
    default: 10
  },
  // Service categories available in this area
  availableCategories: [{
    type: String
  }],
  // Price modifier for this area (e.g., 1.1 for 10% higher in premium areas)
  priceModifier: {
    type: Number,
    default: 1.0
  },
  // Delivery/travel fee
  travelFee: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create 2dsphere index for geospatial queries
serviceAreaSchema.index({ boundary: '2dsphere' });
serviceAreaSchema.index({ center: '2dsphere' });

module.exports = mongoose.model('ServiceArea', serviceAreaSchema);