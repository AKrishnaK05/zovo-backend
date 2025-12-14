const express = require('express');
const router = express.Router();
const azureMapsService = require('../services/azureMaps');
const { protect } = require('../middlewares/auth');

// @route   GET /api/maps/geocode
// @desc    Get coordinates for an address
// @access  Private (Protect to prevent abuse/bill shock)
router.get('/geocode', protect, async (req, res, next) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ success: false, error: 'Address is required' });
        }

        const data = await azureMapsService.geocodeAddress(address);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/maps/route
// @desc    Get distance and duration between two points
// @access  Private
router.get('/route', protect, async (req, res, next) => {
    try {
        // Expect "lat,lng" format strings
        const { origin, destination } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ success: false, error: 'Origin and Destination required' });
        }

        const data = await azureMapsService.getRoute(origin, destination);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/maps/config
// @desc    Get public map config (like Client ID) for Frontend SDK
// @access  Public
router.get('/config', (req, res) => {
    // NEVER return the Subscription Key here if you want to be secure.
    // Ideally, frontend uses a separate Auth mechanism (AAD) or simpler SAS token.
    // For now, if we assume the Key is backend-only, we just return nothing or safe config.
    res.status(200).json({
        success: true,
        clientId: process.env.AZURE_MAPS_CLIENT_ID || null // If using AAD auth in future
    });
});

module.exports = router;
