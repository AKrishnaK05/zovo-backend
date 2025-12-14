const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Route imports
const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const workerRoutes = require("./routes/worker");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/reviews");
const pricingRoutes = require("./routes/pricing");
const availabilityRoutes = require("./routes/availability");
const areaRoutes = require("./routes/areas");
const locationRoutes = require("./routes/location");

const errorHandler = require("./middlewares/errorHandler");

const app = express();

/* ============================
   Allowed Origins (IMPORTANT)
   ============================ */
const allowedOrigins = [
  "https://red-water-0e427d600.3.azurestaticapps.net",
  "http://localhost:5173",
  "http://localhost:5174"
];

/* ============================
   Core Middleware
   ============================ */

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server & tools like curl/postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// IMPORTANT: handle preflight
app.options("*", cors());

app.use(helmet());

// Parse JSON bodies (CRITICAL for req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================
   Logging
   ============================ */
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* ============================
   Routes
   ============================ */
app.use("/auth", authRoutes);
app.use("/jobs", jobRoutes);
app.use("/worker", workerRoutes);
app.use("/admin", adminRoutes);
app.use("/reviews", reviewRoutes);
app.use("/pricing", pricingRoutes);
app.use("/availability", availabilityRoutes);
app.use("/areas", areaRoutes);
app.use("/location", locationRoutes);

/* ============================
   Health Check
   ============================ */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Zovo Backend API is running (Azure App Service)"
  });
});

/* ============================
   404 Handler
   ============================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`
  });
});

/* ============================
   Error Handler
   ============================ */
app.use(errorHandler);

module.exports = app;
