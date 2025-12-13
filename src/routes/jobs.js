// src/routes/jobs.js
const express = require('express');
const router = express.Router();

// ✅ FIXED: Use 'middlewares' (with 's') to match your folder name
const { protect, authorize } = require('../middlewares/auth');

const {
  getJobs,
  getAvailableJobs,
  getJob,
  createJob,
  acceptJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  cancelJob // <-- Import
} = require('../controllers/jobController');

// All routes are protected
router.use(protect);

// GET /api/jobs - Get jobs based on user role
router.get('/', getJobs);

// GET /api/jobs/available - Workers only
router.get('/available', authorize('worker'), getAvailableJobs);

// POST /api/jobs - Customers only
router.post('/', authorize('customer'), createJob);

// GET /api/jobs/:id - Get single job
router.get('/:id', getJob);

// PUT /api/jobs/:id - Update job
router.put('/:id', updateJob);

// PUT /api/jobs/:id/cancel - Customers only
router.put('/:id/cancel', authorize('customer'), cancelJob);

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', deleteJob);

// PUT /api/jobs/:id/accept - Workers only
router.put('/:id/accept', authorize('worker'), acceptJob);

// PUT /api/jobs/:id/status - Workers only
router.put('/:id/status', authorize('worker'), updateJobStatus);

module.exports = router;