const express = require('express');
const router = express.Router();
const { negotiate } = require('../controllers/negotiateController');

// GET /api/negotiate
router.get('/', negotiate);

module.exports = router;
