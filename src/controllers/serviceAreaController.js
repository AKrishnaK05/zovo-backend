const ServiceArea = require('../models/ServiceArea');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Check if location is serviceable
 * @route POST /api/areas/check
 * @access Public
 */
const checkServiceability = async (req, res, next) => {
  try {
    const { coordinates, category } = req.body; // [lng, lat]

    if (!coordinates || coordinates.length !== 2) {
      return next(new ErrorResponse('Valid coordinates are required', 400));
    }

    // Find service area containing this point
    const serviceArea = await ServiceArea.findOne({
      isActive: true,
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          }
        }
      }
    });

    if (!serviceArea) {
      // Check if within any radius-based area
      const nearbyArea = await ServiceArea.findOne({
        isActive: true,
        center: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: 25000 // 25km
          }
        }
      });

      if (!nearbyArea) {
        return res.status(200).json({
          success: true,
          serviceable: false,
          message: 'Sorry, we do not serve this location yet',
          data: null
        });
      }
    }

    const area = serviceArea || nearbyArea;

    // Check if category is available in this area
    if (category && area.availableCategories.length > 0) {
      if (!area.availableCategories.includes(category)) {
        return res.status(200).json({
          success: true,
          serviceable: false,
          message: `${category} service is not available in this area`,
          data: {
            area: area.name,
            availableCategories: area.availableCategories
          }
        });
      }
    }

    // Count available workers in this area
    const nearbyWorkers = await User.countDocuments({
      role: 'worker',
      isActive: true,
      isAvailable: true,
      ...(category && { serviceCategories: category }),
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: area.radius * 1000
        }
      }
    });

    res.status(200).json({
      success: true,
      serviceable: true,
      data: {
        area: area.name,
        city: area.city,
        priceModifier: area.priceModifier,
        travelFee: area.travelFee,
        availableCategories: area.availableCategories,
        nearbyWorkers,
        estimatedArrival: nearbyWorkers > 5 ? '30-45 mins' : '45-60 mins'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all service areas (for map display)
 * @route GET /api/areas
 * @access Public
 */
const getServiceAreas = async (req, res, next) => {
  try {
    const { city } = req.query;

    const query = { isActive: true };
    if (city) query.city = new RegExp(city, 'i');

    const areas = await ServiceArea.find(query)
      .select('name city center radius availableCategories priceModifier');

    res.status(200).json({
      success: true,
      count: areas.length,
      data: areas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby workers for map display
 * @route GET /api/areas/workers
 * @access Public
 */
const getNearbyWorkers = async (req, res, next) => {
  try {
    const { lng, lat, category, radius = 10 } = req.query;

    if (!lng || !lat) {
      return next(new ErrorResponse('Coordinates are required', 400));
    }

    const workers = await User.find({
      role: 'worker',
      isActive: true,
      isAvailable: true,
      ...(category && { serviceCategories: category }),
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    })
    .select('name serviceCategories averageRating totalReviews location')
    .limit(20);

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers.map(w => ({
        id: w._id,
        name: w.name,
        categories: w.serviceCategories,
        rating: w.averageRating,
        reviews: w.totalReviews,
        location: w.location?.coordinates?.coordinates
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkServiceability,
  getServiceAreas,
  getNearbyWorkers
};