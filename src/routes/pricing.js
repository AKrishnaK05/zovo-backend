const express = require('express');
const router = express.Router();
const {
  calculatePrice,
  getCategories,
  getCategory
} = require('../controllers/pricingController');

router.post('/calculate', calculatePrice);
router.get('/categories', getCategories);
router.get('/categories/:slug', getCategory);

module.exports = router;