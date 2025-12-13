const express = require('express');
const router = express.Router();
const {
  checkServiceability,
  getServiceAreas,
  getNearbyWorkers
} = require('../controllers/serviceAreaController');

router.post('/check', checkServiceability);
router.get('/', getServiceAreas);
router.get('/workers', getNearbyWorkers);

module.exports = router;