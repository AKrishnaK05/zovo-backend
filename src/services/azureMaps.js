const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');

class AzureMapsService {
    constructor() {
        this.subscriptionKey = process.env.AZURE_MAPS_KEY;
        this.baseUrl = 'https://atlas.microsoft.com';
        this.apiVersion = '1.0';
    }

    /**
     * Geocode an address (Address -> Coordinates)
     * @param {string} address 
     * @returns {Promise<{lat: number, lng: number, formattedAddress: string}>}
     */
    async geocodeAddress(address) {
        if (!this.subscriptionKey) {
            console.warn('⚠️ AZURE_MAPS_KEY is missing. Geocoding skipped.');
            return null;
        }

        try {
            const url = `${this.baseUrl}/search/address/json`;
            const response = await axios.get(url, {
                params: {
                    'subscription-key': this.subscriptionKey,
                    'api-version': this.apiVersion,
                    query: address,
                    limit: 1
                }
            });

            const results = response.data.results;
            if (!results || results.length === 0) {
                throw new ErrorResponse('Address not found', 404);
            }

            const result = results[0];
            return {
                lat: result.position.lat,
                lng: result.position.lon,
                formattedAddress: result.address.freeformAddress
            };

        } catch (error) {
            console.error('Azure Maps Geocode Error:', error.message);
            // Don't crash the app if map fails, just return null or rethrow specific errors
            if (error instanceof ErrorResponse) throw error;
            throw new ErrorResponse('Map service unavailable', 503);
        }
    }

    /**
     * Calculate Route (Distance & Time)
     * @param {string} origin "lat,lng"
     * @param {string} destination "lat,lng"
     * @returns {Promise<{distance: number, duration: number}>} distance in meters, duration in seconds
     */
    async getRoute(origin, destination) {
        if (!this.subscriptionKey) return null;

        try {
            const url = `${this.baseUrl}/route/directions/json`;
            const response = await axios.get(url, {
                params: {
                    'subscription-key': this.subscriptionKey,
                    'api-version': this.apiVersion,
                    query: `${origin}:${destination}`
                }
            });

            const routes = response.data.routes;
            if (!routes || routes.length === 0) {
                throw new ErrorResponse('No route found', 404);
            }

            const summary = routes[0].summary;
            return {
                distance: summary.lengthInMeters,
                duration: summary.travelTimeInSeconds
            };

        } catch (error) {
            console.error('Azure Maps Route Error:', error.message);
            throw new ErrorResponse('Route calculation failed', 503);
        }
    }
}

module.exports = new AzureMapsService();
