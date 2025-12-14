const express = require('express');
const router = express.Router();
const geocodingService = require('../services/geocoding');
// No 'protect' middleware by default to allow easy Initial usage, 
// but recommended to add if you want to restrict to logged-in users.
const { protect } = require('../middlewares/auth');

// @route   GET /api/location/reverse
// @desc    Get address from lat/lng
// @access  Public (or Private)
router.get('/reverse', async (req, res, next) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Lat and Lng are required' });
        }

        const data = await geocodingService.reverseGeocode(lat, lng);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/location/search
// @desc    Search for an address
// @access  Public
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, error: 'Search query is required' });
        }

        const data = await geocodingService.geocode(q);

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
