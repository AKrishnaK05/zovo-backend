const fs = require('fs');
const path = require('path');

// Paths
const MODEL_PATH = path.join(__dirname, '../ml/dispatch_model.onnx');
// const META_PATH = path.join(__dirname, '../ml/model_metadata.json'); // metadata optional if hardcoded

let session = null;
let onnx = null; // Lazy load holder

// Mock metadata if file missing (or load it if present)
let metadata = {
    features: [
        'distance_km', 'booking_value', 'skill_match_score', 'driver_avg_rating', 'customer_repeat_rate',
        'traffic_index', 'temp', 'humidity', 'peak_hour', 'service_category_cleaning',
        'service_category_plumbing', 'service_category_electrician', 'weather_Clear',
        'weather_Clouds', 'weather_Rain'
    ],
    classes: { 0: "0", 1: "1" } // Placeholder, will try to use Map if this fails
};


/**
 * Load model and metadata.
 */
async function loadModel() {
    if (session) return;

    try {
        console.log('Loading ML model (Lazy)...');

        // 🛡️ LAZY LOAD: Prevent Startup Crash
        if (!onnx) {
            onnx = require('onnxruntime-node');
        }

        // Verify file exists
        if (!fs.existsSync(MODEL_PATH)) {
            console.error("❌ Model file not found:", MODEL_PATH);
            return;
        }

        // Load ONNX Session
        session = await onnx.InferenceSession.create(MODEL_PATH);
        console.log('✅ ML Model loaded successfully.');
    } catch (error) {
        console.error('🔥 Failed to load ML model:', error.message);
        session = null;
    }
}

/**
 * Get probability scores for all drivers.
 * @param {Object} inputData 
 * @returns {Promise<Object>} Map of driverId -> probability (0-1)
 */
async function getDriverScoring(inputData) {
    if (!session) {
        await loadModel();
        if (!session) return {}; // Fail safe
    }

    try {
        const { features } = metadata;
        const inputTensor = new Float32Array(features.length).fill(0);

        // Map features
        features.forEach((featureName, index) => {
            if (inputData.hasOwnProperty(featureName) && typeof inputData[featureName] === 'number') {
                inputTensor[index] = inputData[featureName];
            }
        });

        // OHE (Simple logic)
        const categoricals = ['service_category', 'weather'];
        categoricals.forEach(cat => {
            if (inputData[cat]) {
                const val = inputData[cat];
                const featureName = `${cat}_${val}`;
                const idx = features.indexOf(featureName);
                if (idx !== -1) inputTensor[idx] = 1.0;
            }
        });

        // Create Tensor
        const tensor = new onnx.Tensor('float32', inputTensor, [1, features.length]);

        // Run Inference
        const results = await session.run({ input: tensor }, ['probabilities']);

        // Handle Output
        if (!results || !results.probabilities) return {};

        const probabilityMap = results.probabilities.data[0];
        const scores = {};

        // Parse Map (classId -> prob)
        // Note: In Node runtime, ZipMap might be specific object
        if (probabilityMap instanceof Map) {
            probabilityMap.forEach((prob, key) => {
                scores[String(key)] = prob;
            });
        }
        else if (typeof probabilityMap === 'object') {
            Object.keys(probabilityMap).forEach(key => {
                scores[String(key)] = probabilityMap[key];
            });
        }

        return scores;

    } catch (err) {
        console.warn("Scoring inference failed:", err.message);
        return {};
    }
}

module.exports = {
    loadModel,
    getDriverScoring
};
