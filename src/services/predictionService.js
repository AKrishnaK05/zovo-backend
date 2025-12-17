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
        // 9 Numerics
        'distance_km', 'booking_value', 'skill_match_score', 'driver_avg_rating', 'customer_repeat_rate',
        'traffic_index', 'temp', 'humidity', 'peak_hour',
        // 12 Service Categories (Alphabetical-ish or standard)
        'service_category_ac-service',
        'service_category_appliance',
        'service_category_carpentry',
        'service_category_cleaning',
        'service_category_electrical',
        'service_category_men-grooming',
        'service_category_movers',
        'service_category_other',
        'service_category_painting',
        'service_category_pest-control',
        'service_category_plumbing',
        'service_category_salon',
        // 3 Weather
        'weather_Clear',
        'weather_Clouds',
        'weather_Rain'
    ],
    classes: { 0: "0", 1: "1" } // Placeholder
};


// 🛡️ Singleton Promise to prevent race conditions during Promise.all
let loadingPromise = null;

/**
 * Load model and metadata.
 */
async function loadModel() {
    if (session) return; // Already loaded
    if (loadingPromise) return loadingPromise; // Already loading, wait for it

    // Start loading
    loadingPromise = (async () => {
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
        } finally {
            loadingPromise = null; // Reset lock
        }
    })();

    return loadingPromise;
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


        // Create Tensor
        await loadModel(); // Ensure model is loaded
        if (!session) { // If model failed to load, trigger fallback
            throw new Error("ML model not loaded.");
        }

        // Lazy Load Label Map
        if (!labelMap) {
            try {
                const mapPath = path.join(__dirname, '../ml/worker_label_map.json');
                if (fs.existsSync(mapPath)) {
                    labelMap = require(mapPath);
                    console.log(`✅ Loaded Label Map (${Object.keys(labelMap).length} workers)`);
                } else {
                    console.warn("⚠️ Label map not found. New workers will use Heuristic.");
                    labelMap = {};
                }
            } catch (e) {
                console.error("Failed to load label map:", e.message);
                labelMap = {};
            }
        }

        // Prepare Tensor
        const features = metadata.features.map(f => {
            const val = inputData[f];
            return (val === undefined || val === null) ? 0 : parseFloat(val);
        });

        const inputTensor = new onnx.Tensor('float32', new Float32Array(features), [1, metadata.features.length]);

        // Run Inference
        const results = await session.run({ [session.inputNames[0]]: inputTensor });

        // Output: "probabilities" is a Float32Array [1, N] (Tensor)
        // We need to find the index for THIS worker.
        const probs = results.probabilities.data; // Float32Array

        let score = 0;

        if (workerId && labelMap && labelMap.hasOwnProperty(workerId)) {
            const index = labelMap[workerId];
            if (index >= 0 && index < probs.length) {
                score = probs[index];
                // console.log(`🤖 ML Score for ${workerId} (Index ${index}): ${score.toFixed(4)}`);
            } else {
                console.warn(`⚠️ Index ${index} out of bounds for tensor size ${probs.length}`);
                throw new Error("Worker index out of bounds"); // Trigger fallback
            }
        } else {
            // Worker Unknown to Model -> Use Heuristic
            // console.log(`🆕 Worker ${workerId} unknown to ML. Using Heuristic.`);
            throw new Error("Worker Unknown"); // Trigger fallback below
        }

        return { [workerId]: score };

    } catch (err) {
        // console.warn("⚠️ Scoring inference failed/skipped:", err.message);
        // console.log("🔄 Switching to Hybrid Scoring (Rating + Distance)...");

        // HEURISTIC FALLBACK
        const score = calculateHeuristic(inputData);
        // Return with 'heuristic_score' key so controller finds it
        return { "heuristic_score": score };
    }
}

/**
 * Calculate score based on Rating, Distance, and Service Match
 */
function calculateHeuristic(data) {
    // 1. Rating (0-5) -> Normalize to 0-1 (Weight: 40%)
    const rating = data.driver_avg_rating || 4.0;
    const normRating = Math.min(Math.max(rating / 5.0, 0), 1);

    // 2. Distance (Inverse) -> Closer is better (Weight: 40%)
    const dist = data.distance_km || 5.0;
    const normDist = 1 / (dist + 1); // 1km -> 0.5, 10km -> 0.09

    // 3. Random noise for variability (Weight: 20%)
    const noise = Math.random();

    // Weighted Sum
    // Rating is most important, then distance.
    // Score ~ 0.4*R + 0.4*D + 0.2*Noise
    let finalScore = (normRating * 0.4) + (normDist * 0.4) + (noise * 0.2);

    return parseFloat(finalScore.toFixed(4));
}

module.exports = {
    loadModel,
    getDriverScoring
};
