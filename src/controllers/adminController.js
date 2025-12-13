const User = require('../models/User');
const Job = require('../models/Job');
const ServiceCategory = require('../models/ServiceCategory');
const PricingRule = require('../models/PricingRule');
const ServiceArea = require('../models/ServiceArea');
const ErrorResponse = require('../utils/errorResponse');

// ============ USERS ============

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ JOBS ============

// @desc    Get all jobs
// @route   GET /api/admin/jobs
// @access  Private (Admin)
const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find()
      .populate('customer', 'name email phone')
      .populate('worker', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job
// @route   PUT /api/admin/jobs/:id
// @access  Private (Admin)
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return next(new ErrorResponse('Job not found', 404));
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return next(new ErrorResponse('Job not found', 404));
    }
    res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ SERVICE CATEGORIES ============

const getCategories = async (req, res, next) => {
  try {
    const categories = await ServiceCategory.find().sort('sortOrder');
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ PRICING RULES ============

const getPricingRules = async (req, res, next) => {
  try {
    const rules = await PricingRule.find().sort('-priority');
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

const createPricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

const updatePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!rule) {
      return next(new ErrorResponse('Pricing rule not found', 404));
    }
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

const deletePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return next(new ErrorResponse('Pricing rule not found', 404));
    }
    res.status(200).json({ success: true, message: 'Pricing rule deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ SERVICE AREAS ============

const getServiceAreas = async (req, res, next) => {
  try {
    const areas = await ServiceArea.find();
    res.status(200).json({ success: true, data: areas });
  } catch (error) {
    next(error);
  }
};

const createServiceArea = async (req, res, next) => {
  try {
    const area = await ServiceArea.create(req.body);
    res.status(201).json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
};

const updateServiceArea = async (req, res, next) => {
  try {
    const area = await ServiceArea.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!area) {
      return next(new ErrorResponse('Service area not found', 404));
    }
    res.status(200).json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
};

const deleteServiceArea = async (req, res, next) => {
  try {
    const area = await ServiceArea.findByIdAndDelete(req.params.id);
    if (!area) {
      return next(new ErrorResponse('Service area not found', 404));
    }
    res.status(200).json({ success: true, message: 'Service area deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ DASHBOARD STATS ============

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res, next) => {
  try {
    // Date for "new this week"
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalUsers,
      totalCustomers,
      totalWorkers,
      newUsersThisWeek,
      totalJobs,
      pendingJobs,
      completedJobs,
      activeJobs,
      newJobsThisWeek,
      revenueStats,
      workerEarningsStats,
      workerRatingStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'pending' }),
      Job.countDocuments({ status: 'completed' }),
      Job.countDocuments({ status: { $in: ['accepted', 'in_progress'] } }),
      Job.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Job.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } }
      ]),
      // Worker Earnings Stats
      Job.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$worker', totalEarnings: { $sum: '$finalPrice' }, totalJobs: { $sum: 1 } } },
        { $sort: { totalEarnings: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'workerDetails' } },
        { $unwind: '$workerDetails' },
        { $project: { name: '$workerDetails.name', earnings: '$totalEarnings', jobs: '$totalJobs' } }
      ]),
      // Worker Ratings Stats
      User.find({ role: 'worker', totalReviews: { $gt: 0 } })
        .select('name averageRating totalReviews')
        .sort('-averageRating')
        .limit(5)
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // Recent jobs
    const recentJobs = await Job.find()
      .populate('customer', 'name')
      .populate('worker', 'name')
      .sort('-createdAt')
      .limit(5);

    // Recent users
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          workers: totalWorkers,
          newThisWeek: newUsersThisWeek
        },
        jobs: {
          total: totalJobs,
          pending: pendingJobs,
          completed: completedJobs,
          active: activeJobs,
          newThisWeek: newJobsThisWeek
        },
        revenue: {
          total: totalRevenue
        },
        performance: {
          earnings: workerEarningsStats,
          ratings: workerRatingStats
        },
        recentJobs,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getJobs,
  updateJob,
  deleteJob,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  getServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  getStats
};