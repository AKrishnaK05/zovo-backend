// src/services/modelClient.js
const axios = require('axios');

const MODEL_API_URL = process.env.MODEL_API_URL || "http://localhost:7071/api/recommend";
const MODEL_API_KEY = process.env.MODEL_API_KEY || null; // optional

async function getWorkerRecommendations(featurePayload, topK = 3) {
  try {
    const body = { ...featurePayload, top_k: topK };

    console.log("📡 Sending payload to ML model at", MODEL_API_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (MODEL_API_KEY) headers['x-functions-key'] = MODEL_API_KEY;

    const start = Date.now();
    const response = await axios.post(MODEL_API_URL, body, {
      timeout: 15000,
      headers
    });
    const latency = Date.now() - start;
    console.log("🤖 ML Response status:", response.status, "latency_ms:", latency);
    console.log("🤖 ML Response data:", response.data);

    return response.data;
  } catch (err) {
    // log diagnostics
    if (err.response) {
      console.error("❌ ML API responded with status:", err.response.status);
      console.error("❌ ML API response body:", err.response.data);
    } else if (err.request) {
      console.error("❌ No response from ML API. err.code:", err.code);
    } else {
      console.error("❌ ML API Error:", err.message);
    }

    // fallback - deterministic development recommendations
    console.warn("⚠️ Falling back to local deterministic recommendations.");
    return {
      top_k: topK,
      recommended_workers: [122, 5, 242],
      probabilities: Array(topK).fill(1 / topK)
    };
  }
}

module.exports = { getWorkerRecommendations };
