const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  securityQuestion: {
    type: String,
    // required: false - Validation handled in auth controller
  },
  securityAnswer: {
    type: String,
    // required: false - Validation handled in auth controller
    select: false // Hide by default
  },
  role: {
    type: String,
    enum: ['customer', 'worker', 'admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Worker specific fields
  serviceCategories: {
    type: [String],
    enum: ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'appliance', 'appliance-repair', 'ac-service', 'pest-control', 'salon', 'men-grooming', 'movers', 'gardening', 'laundry', 'cooking', 'security', 'computer', 'mobile', 'car-wash', 'photography', 'tutoring', 'fitness', 'massage', 'other'],
    default: []
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  activeJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  experience: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  location: {
    city: { type: String, default: '' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }
}, { timestamps: true });

// Hash password and security answer before save
userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified('securityAnswer')) {
    this.securityAnswer = await bcrypt.hash(this.securityAnswer, salt);
  }

  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare security answer method
userSchema.methods.matchSecurityAnswer = async function (enteredAnswer) {
  return await bcrypt.compare(enteredAnswer, this.securityAnswer);
};

// Method to update rating when new review is added
userSchema.methods.updateRating = async function (newRating) {
  const totalRatingPoints = (this.averageRating * this.totalReviews) + newRating;
  this.totalReviews += 1;
  this.averageRating = Math.round((totalRatingPoints / this.totalReviews) * 10) / 10;
  await this.save();
};

// FIX: Check if model exists before compiling to prevent OverwriteModelError
module.exports = mongoose.models.User || mongoose.model('User', userSchema);