const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Route imports
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const workerRoutes = require('./routes/worker');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const pricingRoutes = require('./routes/pricing');
const availabilityRoutes = require('./routes/availability');
const areaRoutes = require('./routes/areas');

const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(helmet());

// Debug Logging for Azure Routes
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
// Mount routes directly (No more Azure Functions /api hack)
app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);
app.use('/worker', workerRoutes);
app.use('/admin', adminRoutes);
app.use('/reviews', reviewRoutes);
app.use('/pricing', pricingRoutes);
app.use('/availability', availabilityRoutes);
app.use('/areas', areaRoutes);
// app.use('/negotiate', ...); // REMOVED as per plan (Socket.IO handles connection)

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zovo Backend API is running (App Service v1.0)'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found. Zovo Backend API is running. Received: ${req.method} ${req.url}`
  });
});

app.use(errorHandler);

module.exports = app;