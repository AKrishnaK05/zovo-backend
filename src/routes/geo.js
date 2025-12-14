const express = require('express');
const router = express.Router();
const geocodingService = require('../services/geocoding');
const { protect } = require('../middlewares/auth');

// @route   GET /api/geo/reverse
// @desc    Get address from lat/lng (for "Pin on Map")
router.get('/reverse', protect, async (req, res, next) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Lat and Lng required' });
        }

        const data = await geocodingService.reverseGeocode(lat, lng);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/geo/search
// @desc    Get coordinates from address string
router.get('/search', protect, async (req, res, next) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ success: false, error: 'Address required' });
        }

        const data = await geocodingService.geocode(address);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
