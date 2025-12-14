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

// Service Areas (Frontend expects /admin/service-areas)
const { getServiceAreas } = require('../controllers/serviceAreaController');
router.get('/service-areas', getServiceAreas);

// Pricing Rules (Frontend expects /admin/pricing-rules)
const { getCategories } = require('../controllers/pricingController');
router.get('/pricing-rules', getCategories);

module.exports = router;