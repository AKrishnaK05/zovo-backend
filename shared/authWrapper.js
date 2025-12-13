const { protect } = require('../src/middlewares/auth');

/**
 * Wraps a controller handler with the protect middleware for Azure Functions adapter.
 * Handles the case where middleware responds directly (e.g. 401) without calling next().
 * 
 * @param {Function} handler - The controller function (req, res, next)
 * @returns {Function} - Wrapped function (req, res, next)
 */
const withAuth = (handler) => (req, res, next) => {
    return new Promise((resolve, reject) => {
        // Flag to track if middleware handled the response
        let handled = false;

        // Intercept response methods to detect if middleware responded
        const originalJson = res.json;
        res.json = function (...args) {
            handled = true;
            originalJson.apply(this, args);
            resolve(); // Resolve because response is being sent
        };

        const originalSend = res.send;
        res.send = function (...args) {
            handled = true;
            originalSend.apply(this, args);
            resolve();
        };

        const originalEnd = res.end;
        res.end = function (...args) {
            handled = true;
            originalEnd.apply(this, args);
            resolve();
        };

        const originalStatus = res.status;
        res.status = function (...args) {
            // status() returns 'this', so we just call original and return 'this' (which triggers the intercepted json/send later)
            originalStatus.apply(this, args);
            return this;
        };

        // Run middleware
        protect(req, res, (err) => {
            if (handled) return; // Already responded? shouldn't happen if next called

            if (err) {
                // If middleware calls next(err)
                reject(err);
            } else {
                // Middleware called next() successfully
                try {
                    const result = handler(req, res, next); // handler might use res.json
                    // If handler returns a promise, we chain it. 
                    if (result && typeof result.then === 'function') {
                        result.then(resolve).catch(reject);
                    } else {
                        // If handler is sync and returns void/undefined (uses res.json), 
                        // we generally expect res.json to have been called inside it, resolving the promise via interceptor.
                        if (result !== undefined) {
                            resolve(result);
                        }
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
};

module.exports = { withAuth };
