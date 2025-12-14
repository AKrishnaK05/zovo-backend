const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');

class GeocodingService {
    constructor() {
        this.baseUrl = 'https://nominatim.openstreetmap.org';
        // Nominatim requires a User-Agent to identify the application
        this.userAgent = 'ZovoApp/1.0 (zovo-backend@example.com)';
    }

    /**
     * Reverse Geocode: Get Address from Coordinates
     * @param {number} lat 
     * @param {number} lng 
     * @returns {Promise<string>} Formatted Address
     */
    async reverseGeocode(lat, lng) {
        try {
            const response = await axios.get(`${this.baseUrl}/reverse`, {
                params: {
                    format: 'json',
                    lat: lat,
                    lon: lng,
                    zoom: 18,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': this.userAgent
                }
            });

            if (response.data && response.data.display_name) {
                return {
                    formattedAddress: response.data.display_name,
                    details: response.data.address
                };
            }
            return null;
        } catch (error) {
            console.error('OSM Reverse Geocode Error:', error.message);
            // Fail silently or throw generic error
            throw new ErrorResponse('Unable to fetch address', 503);
        }
    }

    /**
     * Forward Geocode: Get Coordinates from Address
     * @param {string} address 
     * @returns {Promise<{lat: number, lng: number}>}
     */
    async geocode(address) {
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1
                },
                headers: {
                    'User-Agent': this.userAgent
                }
            });

            if (response.data && response.data.length > 0) {
                return {
                    lat: parseFloat(response.data[0].lat),
                    lng: parseFloat(response.data[0].lon),
                    formattedAddress: response.data[0].display_name
                };
            }
            return null;
        } catch (error) {
            console.error('OSM Geocode Error:', error.message);
            throw new ErrorResponse('Unable to find location', 503);
        }
    }
}

module.exports = new GeocodingService();
