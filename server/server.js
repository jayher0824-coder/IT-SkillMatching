const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

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

// Security and CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'client', 'public')));
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
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'admin.html'));
});

// Serve static files and handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
