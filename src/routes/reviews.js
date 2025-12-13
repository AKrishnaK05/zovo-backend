// backend/src/routes/reviews.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  createReview,
  getWorkerReviews,
  getMyReviews,
  getJobReview,
  updateReview,
  respondToReview,
  deleteReview,
  getAllReviews
} = require('../controllers/reviewController');

// Public routes
router.get('/worker/:workerId', getWorkerReviews);

// Protected routes
router.use(protect);

router.post('/', createReview);
router.get('/my-reviews', getMyReviews); // For workers
router.get('/job/:jobId', getJobReview);
router.put('/:id', updateReview);
router.put('/:id/respond', respondToReview);
router.delete('/:id', deleteReview); // Logic inside controller handles ownership/admin check

// Admin only
router.get('/', authorize('admin'), getAllReviews);

module.exports = router;