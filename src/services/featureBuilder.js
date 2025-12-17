// src/services/featureBuilder.js

function oneHotCategory(category, categories) {
  const encoded = {};
  categories.forEach(c => {
    encoded[`service_category_${c}`] = c === category ? 1 : 0;
  });
  return encoded;
}

function oneHotWeather(w, weatherValues) {
  const encoded = {};
  weatherValues.forEach(val => {
    encoded[`weather_${val}`] = (w === val ? 1 : 0);
  });
  return encoded;
}

function buildJobFeatureVector(job, worker = null) {
  const category = job.category.toLowerCase();
  const weather = job.weather || "nan";

  const categoryOptions = [
    "ac-service", "appliance", "carpentry", "cleaning", "electrical",
    "men-grooming", "movers", "other", "painting", "pest-control",
    "plumbing", "salon"
  ];

  const weatherOptions = ["Clear", "Clouds", "Rain"];

  // one-hot encodings
  const categoryEncoding = oneHotCategory(category, categoryOptions);
  const weatherEncoding = oneHotWeather(weather, weatherOptions);

  // Calculate distance if worker location is available
  let dist = 3.5; // default
  if (worker && worker.location && worker.location.coordinates && job.location) {
    // Simple Haversine or Euclidean approx for speed
    const R = 6371; // km
    const dLat = (worker.location.coordinates[1] - job.location.lat) * Math.PI / 180;
    const dLon = (worker.location.coordinates[0] - job.location.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(job.location.lat * Math.PI / 180) * Math.cos(worker.location.coordinates[1] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    dist = R * c;
  }

  // numeric + derived features
  const base = {
    distance_km: dist,
    booking_value: job.estimatedPrice || 300,
    skill_match_score: 0.95, // High match since we pre-filtered by category

    // Per-Worker Features
    driver_avg_rating: worker ? (worker.averageRating || 4.0) : 4.0,
    customer_repeat_rate: worker ? (worker.completedJobs > 5 ? 0.8 : 0.3) : 0.3,

    traffic_index: 0.5,
    temp: 28,
    humidity: 0.65,
    peak_hour: 0
  };

  // Merge (ensure keys match predictionService expectations)
  const finalFeatures = {
    ...base,
    ...categoryEncoding,
    ...weatherEncoding
  };

  return finalFeatures;
}

module.exports = { buildJobFeatureVector };
