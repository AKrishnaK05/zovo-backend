const User = require('../models/User');
const Job = require('../models/Job');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get worker profile
// @route   GET /api/worker/profile
// @access  Private (Worker only)
const getWorkerProfile = async (req, res, next) => {
  try {
    const worker = await User.findById(req.user.id).select('-password');

    if (!worker) {
      return next(new ErrorResponse('Worker not found', 404));
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update worker profile (including service categories)
// @route   PUT /api/worker/profile
// @access  Private (Worker only)
const updateWorkerProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'phone',
      'bio',
      'experience',
      'hourlyRate',
      'serviceCategories',
      'isAvailable',
      'location'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate service categories
    if (updates.serviceCategories) {
      const validCategories = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'appliance', 'other'];
      const invalidCategories = updates.serviceCategories.filter(cat => !validCategories.includes(cat));

      if (invalidCategories.length > 0) {
        return next(new ErrorResponse(`Invalid categories: ${invalidCategories.join(', ')}`, 400));
      }
    }

    const worker = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set worker service categories
// @route   PUT /api/worker/services
// @access  Private (Worker only)
const setServiceCategories = async (req, res, next) => {
  try {
    const { serviceCategories } = req.body;

    if (!serviceCategories || !Array.isArray(serviceCategories)) {
      return next(new ErrorResponse('Service categories must be an array', 400));
    }

    if (serviceCategories.length === 0) {
      return next(new ErrorResponse('Please select at least one service category', 400));
    }

    const validCategories = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'appliance', 'other'];
    const invalidCategories = serviceCategories.filter(cat => !validCategories.includes(cat));

    if (invalidCategories.length > 0) {
      return next(new ErrorResponse(`Invalid categories: ${invalidCategories.join(', ')}`, 400));
    }

    const worker = await User.findByIdAndUpdate(
      req.user.id,
      { serviceCategories },
      { new: true }
    ).select('name serviceCategories');

    res.status(200).json({
      success: true,
      message: 'Service categories updated successfully',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle worker availability
// @route   PUT /api/worker/availability
// @access  Private (Worker only)
const toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return next(new ErrorResponse('isAvailable must be a boolean', 400));
    }

    const worker = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true }
    ).select('name isAvailable');

    res.status(200).json({
      success: true,
      message: `You are now ${isAvailable ? 'available' : 'unavailable'} for new jobs`,
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get worker earnings and transaction history
// @route   GET /api/worker/earnings
// @access  Private (Worker only)
const getWorkerEarnings = async (req, res, next) => {
  try {
    // 1. Calculate Summary Stats
    const earningsData = await Job.aggregate([
      {
        $match: {
          worker: req.user._id,
          status: 'completed',
          finalPrice: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$finalPrice' },
          completedJobsCount: { $sum: 1 }
        }
      }
    ]);

    const summary = earningsData.length > 0 ? earningsData[0] : { totalEarnings: 0, completedJobsCount: 0 };

    // 2. Get Recent Transactions (Completed Jobs)
    const transactions = await Job.find({
      worker: req.user._id,
      status: 'completed'
    })
      .select('title finalPrice updatedAt customer status location category')
      .populate('customer', 'name avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        totalEarnings: summary.totalEarnings,
        totalJobs: summary.completedJobsCount,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get worker stats/dashboard data
// @route   GET /api/worker/stats
// @access  Private (Worker only)
const getWorkerStats = async (req, res, next) => {
  try {
    const workerId = req.user.id;

    // Get job counts
    const [pending, active, completed, total] = await Promise.all([
      Job.countDocuments({ status: 'pending', worker: null }),
      Job.countDocuments({ worker: workerId, status: { $in: ['accepted', 'in_progress'] } }),
      Job.countDocuments({ worker: workerId, status: 'completed' }),
      Job.countDocuments({ worker: workerId })
    ]);

    // Get worker's categories to count available jobs
    const worker = await User.findById(workerId).select('serviceCategories averageRating totalReviews');

    const availableJobsInCategory = await Job.countDocuments({
      status: 'pending',
      worker: null,
      category: { $in: worker.serviceCategories || [] }
    });

    // Calculate earnings (sum of finalPrice for completed jobs)
    const earningsData = await Job.aggregate([
      {
        $match: {
          worker: req.user._id,
          status: 'completed',
          finalPrice: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$finalPrice' }
        }
      }
    ]);

    const totalEarnings = earningsData.length > 0 ? earningsData[0].totalEarnings : 0;

    res.status(200).json({
      success: true,
      data: {
        availableJobs: availableJobsInCategory,
        activeJobs: active,
        completedJobs: completed,
        totalJobs: total,
        averageRating: worker.averageRating,
        totalReviews: worker.totalReviews,
        totalEarnings,
        serviceCategories: worker.serviceCategories
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public worker profile (for customers to view)
// @route   GET /api/worker/:id/public
// @access  Public
const getPublicWorkerProfile = async (req, res, next) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      role: 'worker',
      isActive: true
    }).select('name bio experience hourlyRate serviceCategories averageRating totalReviews completedJobs createdAt');

    if (!worker) {
      return next(new ErrorResponse('Worker not found', 404));
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available service categories
// @route   GET /api/worker/categories
// @access  Public
const getServiceCategories = async (req, res, next) => {
  try {
    const categories = [
      { value: 'plumbing', label: 'Plumbing', icon: '🔧', description: 'Pipe repairs, installations, leaks' },
      { value: 'electrical', label: 'Electrical', icon: '⚡', description: 'Wiring, outlets, electrical repairs' },
      { value: 'cleaning', label: 'Cleaning', icon: '🧹', description: 'Home and office cleaning services' },
      { value: 'painting', label: 'Painting', icon: '🎨', description: 'Interior and exterior painting' },
      { value: 'carpentry', label: 'Carpentry', icon: '🪚', description: 'Wood work, furniture, repairs' },
      { value: 'appliance', label: 'Appliance Repair', icon: '🔌', description: 'Home appliance repairs' },
      { value: 'other', label: 'Other Services', icon: '📦', description: 'Other handyman services' }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkerProfile,
  updateWorkerProfile,
  setServiceCategories,
  toggleAvailability,
  getWorkerStats,
  getWorkerEarnings,
  getPublicWorkerProfile,
  getServiceCategories
};