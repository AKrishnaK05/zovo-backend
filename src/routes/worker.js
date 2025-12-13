const express = require('express');
const router = express.Router();
const {
  getWorkerProfile,
  updateWorkerProfile,
  setServiceCategories,
  toggleAvailability,
  getWorkerStats,
  getWorkerEarnings,
  getPublicWorkerProfile,
  getServiceCategories
} = require('../controllers/workerController');
const { protect } = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');

// Public routes
router.get('/categories', getServiceCategories);
router.get('/:id/public', getPublicWorkerProfile);

// Protected worker routes
router.use(protect);
router.use(permit('worker'));

router.get('/profile', getWorkerProfile);
router.put('/profile', updateWorkerProfile);
router.put('/services', setServiceCategories);
router.put('/availability', toggleAvailability);
router.get('/stats', getWorkerStats);
router.get('/earnings', getWorkerEarnings);

module.exports = router;