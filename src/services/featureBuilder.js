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

function buildJobFeatureVector(job) {
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
    drop_lat: job.drop_lat || job.location.lat, // your job model does not have drop location; adjust if needed
    drop_lon: job.drop_lon || job.location.lng,
    distance_km: job.distance_km || 3.5, // fallback
    booking_value: job.estimatedPrice || 300,
    skill_match_score: job.skill_match_score || 0.7,
    driver_avg_rating: 4.5,             // not available yet
    customer_repeat_rate: 0.2,          // not available yet
    traffic_index: 0.5,                 // placeholder
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
