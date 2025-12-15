// src/services/modelClient.js
const { predictDriver } = require('./predictionService');

/**
 * Get worker recommendations using local ONNX model.
 * @param {Object} featurePayload - Feature vector from featureBuilder
 * @param {number} topK - Number of recommendations (currently model returns 1)
 * @returns {Promise<Object>} - { recommended_workers: [id], probabilities: [] }
 */
async function getWorkerRecommendations(featurePayload, topK = 3) {
  try {
    console.log("🤖 Running local ONNX inference...");
    const start = Date.now();

    // Call the prediction service
    const predictedDriverId = await predictDriver(featurePayload);

    const latency = Date.now() - start;
    console.log(`🤖 Inference result: Driver ${predictedDriverId} (latency: ${latency}ms)`);

    // Model currently returns best single driver. 
    // We wrap it in a list to satisfy the controller's expectation of multiple recommendations.
    // In future, if using probas, we can return more.

    return {
      top_k: 1,
      recommended_workers: [predictedDriverId],
      probabilities: [1.0]
    };

  } catch (err) {
    console.error("❌ ML Inference Error:", err.message);

    // Fallback
    console.warn("⚠️ Falling back to default recommendations.");
    return {
      top_k: 3,
      recommended_workers: [], // Return empty or default
      probabilities: []
    };
  }
}

module.exports = { getWorkerRecommendations };
