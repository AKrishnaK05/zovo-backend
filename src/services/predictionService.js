const onnx = require('onnxruntime-node');
const fs = require('fs');
const path = require('path');

// Paths
const MODEL_PATH = path.join(__dirname, '../ml/dispatch_model.onnx');
const META_PATH = path.join(__dirname, '../ml/model_metadata.json');

let session = null;
let metadata = null;

/**
 * Load model and metadata.
 */
async function loadModel() {
    if (session && metadata) return;

    try {
        console.log('Loading ML model...');
        // Load Metadata
        const metaRaw = fs.readFileSync(META_PATH, 'utf8');
        metadata = JSON.parse(metaRaw);

        // Load ONNX Session
        session = await onnx.InferenceSession.create(MODEL_PATH);
        console.log('ML Model loaded successfully.');
    } catch (error) {
        console.error('Failed to load ML model:', error);
        // Non-blocking error? Or should we crash? 
        // For now, log it. The first predict call will fail.
    }
}

/**
 * Predict the best driver for a job.
 * @param {Object} inputData - Raw input features 
 * @returns {Promise<number>} - Best Driver ID
 */
async function predictDriver(inputData) {
    if (!session || !metadata) {
        await loadModel();
        if (!session) throw new Error("Model not loaded");
    }

    const { features, classes } = metadata;
    const inputTensor = new Float32Array(features.length).fill(0); // Initialize zero vector

    // Map inputs to features
    // We expect inputData to have keys matching feature names OR base names for OHE.
    // Example features: ['distance_km', 'pro_cleaning', 'weather_Rain', ...]

    // 1. Numerical Features
    // We explicitly list known numericals or try to find them.
    // Given metadata doesn't distinguish types, we infer from name.
    // If feature name matches input key exactly, map it.

    features.forEach((featureName, index) => {
        // Direct numerical match (e.g., 'distance_km')
        if (inputData.hasOwnProperty(featureName) && typeof inputData[featureName] === 'number') {
            inputTensor[index] = inputData[featureName];
        }
    });

    // 2. Categorical / OHE Features
    // We need to look for inputs like { service_category: 'cleaning' }
    // and set 'service_category_cleaning' = 1.

    // Hardcoded known categoricals from notebook analysis
    const categoricals = ['service_category', 'weather'];

    categoricals.forEach(cat => {
        if (inputData[cat]) {
            const val = inputData[cat];
            // Construct feature name, e.g., "service_category_cleaning"
            // Note: Notebook used pd.get_dummies(..., drop_first=True). 
            // If the value corresponds to a dropped column, all OHE columns remain 0.
            // We look for exact match in variable names.

            const featureName = `${cat}_${val}`;
            const idx = features.indexOf(featureName);
            if (idx !== -1) {
                inputTensor[idx] = 1.0;
            }
        }
    });

    try {
        // Create Tensor
        const tensor = new onnx.Tensor('float32', inputTensor, [1, features.length]);

        // Run Inference
        // 'input' is the name we defined in conversion script
        const feeds = { input: tensor };

        // Explicitly fetch only 'label' to avoid crashing on 'probabilities' (ZipMap/Sequence) in Node.js
        // NOTE: If using onnxruntime-node < 1.14 on some platforms, fetches might need to be output names array.
        const results = await session.run(feeds, ['label']);

        const outputName = 'label'; // We forced this fetch
        const outputMap = results[outputName];
        const predictedIndex = outputMap.data[0]; // If int64, might need conversion
        // Wait, sklearn-onnx usually returns labels directly if 'label' output exists.
        // If output is probabilities, we take argmax.

        // Let's assume standard LGBMClassifier ONNX output:
        // Output 0: label (int64)
        // Output 1: probabilities (sequence of map)

        // We get the class label directly (which corresponds to 'y' in notebook)
        // BUT 'y' was LabelEncoded. We need to map it back to driver_id using `classes`.

        // Check if predictedIndex is a number (it might be BigInt if int64)
        const idx = Number(predictedIndex);

        if (classes && classes[idx] !== undefined) {
            return classes[idx];
        } else {
            // Fallback if direct mapping fails
            return idx;
        }

    } catch (err) {
        console.error("Inference failed:", err);
        throw err;
    }
}

module.exports = {
    loadModel,
    predictDriver
};
