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
    "cleaning", "electrical", "general_maintenance",
    "moving_help", "painting", "plumbing"
  ];

  const weatherOptions = ["Clouds", "Haze", "Rain", "Smoke", "nan"];

  // one-hot encodings
  const categoryEncoding = oneHotCategory(category, categoryOptions);
  const weatherEncoding = oneHotWeather(weather, weatherOptions);

  // numeric + derived features
  const base = {
    pickup_lat: job.location.lat || 0,
    pickup_lon: job.location.lng || 0,
    drop_lat: job.drop_lat || job.location.lat,
    drop_lon: job.drop_lon || job.location.lng,
    distance_km: job.distance_km || 3.5,
    booking_value: job.estimatedPrice || 300,
    skill_match_score: job.skill_match_score || 0.7,

    // Per-Worker Features (if provided) or Defaults
    driver_avg_rating: worker ? (worker.averageRating || 0) : 4.5,
    customer_repeat_rate: worker ? (worker.completedJobs > 10 ? 0.8 : 0.2) : 0.2, // Simple heuristic

    traffic_index: 0.5,
    temp: 28,
    humidity: 0.65,
    peak_hour: 1
  };

  return {
    ...base,
    ...categoryEncoding,
    ...weatherEncoding
  };
}

module.exports = { buildJobFeatureVector };
