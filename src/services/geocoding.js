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

            const response = await axios.get(`${this.baseUrl}/reverse`, {
                params: {
                    format: 'json',
                    lat: lat,
                    lon: lng,
                    zoom: 18,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });

            if (response.data.error) {
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
