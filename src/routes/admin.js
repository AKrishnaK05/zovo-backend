// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser, // Ensure this is imported
  updateUser,
  deleteUser,
  getJobs,
  updateJob,
  deleteJob,
  getStats
} = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');

// All routes require admin authentication
router.use(protect);
router.use(permit('admin'));

// Dashboard stats
router.get('/stats', getStats);

// Users routes
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUser) // Ensure this is used
  .put(updateUser)
  .delete(deleteUser);

// Jobs routes
router.route('/jobs')
  .get(getJobs);

router.route('/jobs/:id')
  .put(updateJob)
  .delete(deleteJob);

module.exports = router;