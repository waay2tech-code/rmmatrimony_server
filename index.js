const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');

// Routes
const rootRoute = require('./src/routes/root.route');
const authRoute = require('./src/routes/authRoutes');
const matchRoute = require('./src/routes/match.route');
const searchRoute = require('./src/routes/search.route');
const userRoute = require('./src/routes/userRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const userReactionsRoute = require('./src/routes/userActions');
const memberIdRoutes = require('./src/routes/memberIdRoutes');

const app = express();

// Allowed origins. FRONTEND_URL may be a comma-separated list so that
// production and local frontends can be enabled together via .env.
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  'https://rmmatrimony.co.in',
  'https://www.rmmatrimony.co.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...configuredOrigins
];

const isOriginAllowed = (origin) => ALLOWED_ORIGINS.includes(origin);

// CORS Configuration - MUST come before other middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no Origin header (mobile apps, curl, server-to-server).
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    // Do NOT throw here. callback(new Error(...)) makes Express fall through to
    // the default error handler, which replies 500 without CORS headers - the
    // browser then reports "No 'Access-Control-Allow-Origin' header", masking
    // the real 403. Refusing without the header keeps the failure readable.
    console.warn('CORS blocked origin:', origin);
    return callback(null, false);
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ],
  exposedHeaders: ['Set-Cookie']
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly.
app.options('*', cors(corsOptions));

// Reject disallowed origins explicitly so the caller gets a clear 403 JSON
// instead of an opaque CORS failure. Registered after cors() so that allowed
// origins already carry their headers.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && !isOriginAllowed(origin)) {
    console.warn('Rejected disallowed origin:', origin, req.method, req.originalUrl);
    return res.status(403).json({ success: false, message: 'Origin not allowed' });
  }

  // Only echo an allowlisted origin back; never reflect an arbitrary one.
  if (origin && isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Other Middleware (order matters - CORS first)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving
app.use("/uploads", express.static("uploads"));

// Test endpoint to check CORS
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'CORS test successful', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin 
  });
});

// Routes
app.use('/', rootRoute);
app.use('/api/auth', authRoute);
app.use('/api/matches', matchRoute);
app.use('/api/search', searchRoute);
app.use('/api/users', userRoute);
// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/userActions', userReactionsRoute);
app.use('/api/memberid', memberIdRoutes);

// ✅ Terminal error handler. MUST be registered last.
//
// Errors raised by middleware - notably multer in uploadMiddleware.js -
// never reach the controller's try/catch. Without this handler they fall
// through to Express's built-in handler, which replies 500 *without* CORS
// headers, so the browser reports the misleading
// "No 'Access-Control-Allow-Origin' header is present" instead of the
// real cause (e.g. a non-image file or a file over the 5 MB limit).
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isMulter =
    err && (err.name === 'MulterError' || /multer|file size|invalid file type/i.test(err.message || ''));

  const status = err?.status || err?.statusCode || (isMulter ? 400 : 500);

  // Re-apply CORS headers so the browser can actually read this error response.
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (status >= 500) console.error('Unhandled server error:', err);
  else console.warn('Request rejected:', err?.message);

  res.status(status).json({
    success: false,
    message: err?.message || 'Internal server error',
  });
});

// Connect to Database and Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});
