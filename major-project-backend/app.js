const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const predictRoutes = require('./routes/predict');
const passwordResetRoutes = require('./routes/passwordReset');
const doctorRoutes = require('./routes/doctor');

const app = express();

// We'll populate CSP after we know allowedOrigins, so define a function we can call after
const helmetMiddleware = (connectSrc) => helmet({
  // Keep defaults; we'll add a basic CSP
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "connect-src": connectSrc,
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Updated: allows Vercel to fetch resources
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },    // Updated: allows cross-origin interaction
  crossOriginEmbedderPolicy: false, // disable if not using COEP/COOP together
});

// HSTS only in production
if (process.env.NODE_ENV === 'production') {
  app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true, preload: true }));
}

// CORS: env-driven origins only; localhost added only in development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_DEV,
  process.env.FRONTEND_URL_PROD,
  process.env.FRONTEND_URL_PREVIEW,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : [])
].filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn('No FRONTEND_URL* env vars set. CORS will reject all cross-origin requests.');
}

if (process.env.NODE_ENV !== 'production') {
  console.log('Allowed CORS origins:', allowedOrigins);
}

// Apply Helmet with connect-src including allowed origins
const connectSrc = ["'self'", ...allowedOrigins];
app.use(helmetMiddleware(connectSrc));

// Apply CORS (Updated to stop crashing on Render health checks)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (e.g., Render health checks, mobile apps, Postman)
    if (!origin) {
      return callback(null, true); 
    }
    
    // Check if the origin is in your allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log the blocked origin for easy debugging in the future
    console.warn(`Blocked by CORS: Origin ${origin} is not allowed.`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

app.use(express.json());
app.use(cookieParser());

// Log loaded env values for debugging (non-prod)
if (process.env.NODE_ENV !== 'production') {
  console.log('Loaded FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('Loaded PORT:', process.env.PORT);
}

// Rate limiter for /api/auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/doctor', doctorRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;