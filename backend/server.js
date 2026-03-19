const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { connectDB } = require('./config/database');
const User = require('./models/User');
const auth = require('./middleware/auth');

const app = express();

// Security headers
app.use(helmet());

// ── Health check (BEFORE rate limiter so keep-alive pings never get throttled) ─
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

// CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Always allow localhost on any port in development
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Always allow Netlify deployments for this project
    if (/^https:\/\/.*\.netlify\.app$/.test(origin)) return callback(null, true);
    // Always allow Render deployments for this project
    if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/requests', require('./routes/groupRequestRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));

// User search endpoint
app.get('/api/users/search', auth, async (req, res) => {
  try {
    const { q, email } = req.query;
    const query = q || email;
    if (!query) {
      return res.status(400).json({ message: 'query param is required' });
    }
    let users;
    if (query.startsWith('@')) {
      users = await User.searchByUsername(query.slice(1), 10);
    } else {
      users = await User.search(query, 10);
    }
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);

      // ── Keep-alive self-ping ──────────────────────────────────────────────
      // Render free tier spins down after ~15 min of inactivity.
      // We ping our own /api/health every 14 minutes to stay awake.
      const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      setInterval(async () => {
        try {
          const res = await fetch(`${SELF_URL}/api/health`);
          console.log(`[keep-alive] ping → ${res.status}`);
        } catch (e) {
          console.warn('[keep-alive] ping failed:', e.message);
        }
      }, 14 * 60 * 1000); // every 14 minutes
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });