const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '..', '.env');
const fs = require('fs');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Validate required environment variables for production
const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('\n' + '='.repeat(60));
  console.error('❌ FATAL: Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('='.repeat(60));
  console.error('\n📝 Please set these variables in your environment:\n');
  console.error('  For Render: Go to Dashboard → Environment → Add Variable');
  console.error('  For Local: Create a .env file with these values');
  console.error('\n');
  process.exit(1);
}

const app = express();

// Trust proxy for accurate IP addresses behind Render's load balancer
app.set('trust proxy', 1);

// Security and CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Helmet for security headers with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting for all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use((req, res, next) => {
  // Simple parameter pollution prevention
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    });
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'client', 'public')));
app.use('/dist', express.static(path.join(__dirname, '..', 'client', 'public', 'dist'), {
  maxAge: '1d',
  etag: false
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'client', 'assets', 'uploads')));
app.use(passport.initialize());
require('./auth/middleware/passport.js')(passport);

// Request logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
      console.log('Request body:', req.body);
    }
    next();
  });
} else {
  // Production: Only log errors and important events
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/auth', require('./api/routes/auth'));
app.use('/api/password-reset', require('./api/routes/passwordReset'));
app.use('/api/settings', require('./api/routes/settings'));
app.use('/api/students', require('./api/routes/students'));
app.use('/api/companies', require('./api/routes/companies'));
app.use('/api/assessments', require('./api/routes/assessments'));
app.use('/api/jobs', require('./api/routes/jobs'));
app.use('/api/feedback', require('./api/routes/feedback'));
app.use('/api/admin', require('./api/routes/admin'));
app.use('/api/custom-assessments', require('./api/routes/customAssessments'));
app.use('/api/notifications', require('./api/routes/notifications'));
app.use('/api/messages', require('./api/routes/messages'));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '(hidden)' : err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error occurred' : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Admin dashboard route
app.get('/admin/*', (req, res) => {
  // Don't serve admin.html for dist files
  if (req.path.startsWith('/admin/dist')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'admin.html'));
});

// Serve static files and handle SPA routing
app.get('*', (req, res) => {
  // Don't serve index.html for dist files (they're already served as static)
  if (req.path.startsWith('/dist')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
