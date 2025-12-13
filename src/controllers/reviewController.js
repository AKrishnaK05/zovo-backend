const Review = require('../models/Review');
const Job = require('../models/Job');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a review for a completed job
// @route   POST /api/reviews
// @access  Private (Customer only)
const createReview = async (req, res, next) => {
  try {
    const { jobId, rating, comment, qualityRating, punctualityRating, professionalismRating } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return next(new ErrorResponse('Rating must be between 1 and 5', 400));
    }

    // Find the job
    const job = await Job.findById(jobId);

    if (!job) {
      return next(new ErrorResponse('Job not found', 404));
    }

    // Verify job belongs to this customer
    if (job.customer.toString() !== req.user.id) {
      return next(new ErrorResponse('You can only review your own jobs', 403));
    }

    // Verify job is completed
    if (job.status !== 'completed') {
      return next(new ErrorResponse('You can only review completed jobs', 400));
    }

    // Verify job has a worker assigned
    if (!job.worker) {
      return next(new ErrorResponse('This job has no worker to review', 400));
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ job: jobId, customer: req.user.id });
    if (existingReview) {
      return next(new ErrorResponse('You have already reviewed this job', 400));
    }

    // Create the review
    const review = await Review.create({
      job: jobId,
      worker: job.worker,
      customer: req.user.id,
      rating,
      comment,
      qualityRating: qualityRating || rating,
      punctualityRating: punctualityRating || rating,
      professionalismRating: professionalismRating || rating
    });

    // Update worker's average rating
    const worker = await User.findById(job.worker);
    await worker.updateRating(rating);

    // Populate and return the review
    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'name')
      .populate('worker', 'name')
      .populate('job', 'title category');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: populatedReview
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return next(new ErrorResponse('You have already reviewed this job', 400));
    }
    next(error);
  }
};

// @desc    Get reviews for a worker
// @route   GET /api/reviews/worker/:workerId
// @access  Public
const getWorkerReviews = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify worker exists
    const worker = await User.findById(workerId).select('name averageRating totalReviews');
    if (!worker || worker.role === 'customer') {
      return next(new ErrorResponse('Worker not found', 404));
    }

    // Get reviews with pagination
    const reviews = await Review.find({ worker: workerId, isVisible: true })
      .populate('customer', 'name')
      .populate('job', 'title category')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ worker: workerId, isVisible: true });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      worker: {
        name: worker.name,
        averageRating: worker.averageRating,
        totalReviews: worker.totalReviews
      },
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my reviews (for logged-in worker)
// @route   GET /api/reviews/my-reviews
// @access  Private (Worker only)
const getMyReviews = async (req, res, next) => {
  try {
    if (req.user.role !== 'worker') {
      return next(new ErrorResponse('Only workers can access this route', 403));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ worker: req.user.id })
      .populate('customer', 'name')
      .populate('job', 'title category')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ worker: req.user.id });

    // Calculate rating breakdown
    const ratingBreakdown = await Review.aggregate([
      { $match: { worker: req.user._id || req.user.id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      ratingBreakdown,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review for a specific job
// @route   GET /api/reviews/job/:jobId
// @access  Private
const getJobReview = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const review = await Review.findOne({ job: jobId })
      .populate('customer', 'name')
      .populate('worker', 'name')
      .populate('job', 'title category status');

    if (!review) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No review found for this job'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Customer only - review owner)
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Verify ownership
    if (review.customer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this review', 403));
    }

    // Store old rating for recalculation
    const oldRating = review.rating;

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    // Recalculate worker's average rating if rating changed
    if (rating && rating !== oldRating) {
      const worker = await User.findById(review.worker);
      const totalPoints = (worker.averageRating * worker.totalReviews) - oldRating + rating;
      worker.averageRating = Math.round((totalPoints / worker.totalReviews) * 10) / 10;
      await worker.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Worker responds to a review
// @route   PUT /api/reviews/:id/respond
// @access  Private (Worker only - review recipient)
const respondToReview = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return next(new ErrorResponse('Response comment is required', 400));
    }

    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Verify the worker is the one being reviewed
    if (review.worker.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to respond to this review', 403));
    }

    review.workerResponse = {
      comment,
      respondedAt: new Date()
    };
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin or review owner)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Only admin or review owner can delete
    if (req.user.role !== 'admin' && review.customer.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this review', 403));
    }

    // Recalculate worker's average rating
    const worker = await User.findById(review.worker);
    if (worker.totalReviews > 1) {
      const totalPoints = (worker.averageRating * worker.totalReviews) - review.rating;
      worker.totalReviews -= 1;
      worker.averageRating = Math.round((totalPoints / worker.totalReviews) * 10) / 10;
    } else {
      worker.totalReviews = 0;
      worker.averageRating = 0;
    }
    await worker.save();

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
// @access  Private (Admin only)
const getAllReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .populate('customer', 'name email')
      .populate('worker', 'name email')
      .populate('job', 'title category')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments();

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getWorkerReviews,
  getMyReviews,
  getJobReview,
  updateReview,
  respondToReview,
  deleteReview,
  getAllReviews
};