const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');

class GeocodingService {
    constructor() {
        this.baseUrl = 'https://nominatim.openstreetmap.org';
        // Nominatim requires a User-Agent to identify the application
        this.userAgent = 'ZovoApp/1.0 (zovo-backendv3.azurewebsites.net)';
    }

    /**
     * Reverse Geocode: Get address from coordinates
     * @param {number} lat 
     * @param {number} lng 
     * @returns {Promise<Object>} Address object
     */
    async reverseGeocode(lat, lng) {
        try {
            if (!lat || !lng) throw new Error('Coordinates required');

            // Validate Coordinates
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);

            if (isNaN(latNum) || isNaN(lngNum)) {
                throw new Error('Invalid coordinates format');
            }
            if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
                console.warn(`⚠️ Out of bounds coordinates: ${lat}, ${lng}`);
                // Return default/null or let it fail? Let it try, but warn.
            }

            const response = await axios.get(`${this.baseUrl}/reverse`, {
                params: {
                    format: 'json',
                    lat: latNum, // Use parsed numbers
                    lon: lngNum,
                    zoom: 18,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 5000 // 5s Timeout (OSM can be slow)
            });

            if (response.data.error) {
                // Determine if it's "Unable to geocode" vs "Rate Limit"
                if (response.data.error.includes('slow down')) {
                    throw new Error('Rate limit exceeded. Please try again in a moment.');
                }
                throw new Error(response.data.error);
            }

            return {
                formattedAddress: response.data.display_name,
                address: response.data.address,
                placeId: response.data.place_id
            };

        } catch (error) {
            console.error('OSM Reverse Geocode Error:', error.message);
            // Fallback or generic error
            throw new ErrorResponse('Unable to fetch address', 503);
        }
    }

    /**
     * Geocode: Get coordinates from address text
     * @param {string} query 
     * @returns {Promise<Array>} List of matches
     */
    async geocode(query) {
        try {
            if (!query) throw new Error('Query required');

            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    format: 'json',
                    q: query,
                    limit: 5,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': this.userAgent
                }
            });

            return response.data.map(item => ({
                lat: item.lat,
                lng: item.lon,
                formattedAddress: item.display_name,
                address: item.address
            }));

        } catch (error) {
            console.error('OSM Geocode Error:', error.message);
            throw new ErrorResponse('Location search failed', 503);
        }
    }
}

module.exports = new GeocodingService();
