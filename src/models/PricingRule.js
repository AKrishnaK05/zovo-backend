const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  // Which categories this rule applies to (empty = all)
  categories: [{
    type: String
  }],
  // Rule type
  ruleType: {
    type: String,
    enum: ['multiplier', 'fixed_add', 'percentage_add'],
    required: true
  },
  // The value to apply (e.g., 1.5 for 50% increase, or 20 for $20 add)
  value: {
    type: Number,
    required: true
  },
  // Conditions for this rule
  conditions: {
    // Day of week (0 = Sunday, 6 = Saturday)
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    // Specific dates (holidays, special events)
    specificDates: [{
      type: Date
    }],
    // Time range (24h format)
    timeRange: {
      start: { type: String }, // "06:00"
      end: { type: String }    // "09:00"
    },
    // Demand threshold (if pending jobs > threshold, apply surge)
    demandThreshold: {
      type: Number,
      default: null
    }
  },
  priority: {
    type: Number,
    default: 0 // Higher priority rules applied first
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PricingRule', pricingRuleSchema);