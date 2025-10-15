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

// CORS Configuration - MUST come before other middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Origin',
    'X-Requested-With',
    'Accept',
    'Cookie',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Set-Cookie']
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly
app.options('*', cors(corsOptions));

// Additional headers to prevent CORB issues
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
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
