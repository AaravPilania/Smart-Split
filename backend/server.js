require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { connectDB } = require('./config/database');
const User = require('./models/User');
const auth = require('./middleware/auth');
const validate = require('./middleware/validate');
const { signupSchema, loginSchema } = require('./validators/authSchema');
const { createGroupSchema } = require('./validators/groupSchema');

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('short'));

// CORS — Updated for Cloudflare Pages
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Always allow localhost in development
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    
    // Allow explicitly listed origins (from .env)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Allow Cloudflare Pages deployments
    if (/^https:\/\/thesmartsplit\.pages\.dev$/.test(origin)) return callback(null, true);
    if (/^https:\/\/.*\.pages\.dev$/.test(origin)) return callback(null, true); // Matches previews

    // Allow Render deployments (for backend-to-backend communication if needed)
    if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return callback(null, true);

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Progressive slowdown — starts adding latency after 200 requests/15min
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 200,
  delayMs: (used) => Math.min((used - 200) * 50, 2000), // +50ms per req over 200, capped at 2s
});
app.use('/api/', speedLimiter);

// Hard rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

// Body parsing — 2MB limit needed for base64 image uploads (group/profile photos)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/requests', require('./routes/groupRequestRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// User search endpoint
app.get('/api/users/search', auth, async (req, res) => {
  try {
    const { q, email } = req.query;
    const query = q || email;
    if (!query) return res.status(400).json({ message: 'query param is required' });
    
    let users;
    if (query.startsWith('@')) {
      users = await User.searchByUsername(query.slice(1), 10);
    } else if (query.includes('@')) {
      users = await User.search(query, 10);
    } else {
      const [byEmail, byUsername] = await Promise.all([
        User.search(query, 10),
        User.searchByUsername(query, 10),
      ]);
      const seen = new Set();
      users = [...byEmail, ...byUsername].filter(u => {
        const id = String(u._id || u.id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Activity log for a group
const ActivityLog = require('./models/ActivityLog');
app.get('/api/groups/:groupId/activity', auth, async (req, res) => {
  try {
    const logs = await ActivityLog
      .find({ groupId: req.params.groupId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ logs });
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
      
      const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      setInterval(async () => {
        try {
          const res = await fetch(`${SELF_URL}/api/health`);
          console.log(`[keep-alive] ping → ${res.status}`);
        } catch (e) {
          console.warn('[keep-alive] ping failed:', e.message);
        }
      }, 14 * 60 * 1000); 
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });