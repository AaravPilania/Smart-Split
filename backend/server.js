const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/database");

// Import routes
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const groupRequestRoutes = require("./routes/groupRequestRoutes");

async function startServer() {
  const app = express();

  // ✅ CORS Configuration - Allow multiple origins
  const allowedOrigins = [
    "https://thesmartsplit.netlify.app",
    "https://smart-split-production.up.railway.app",
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean); // Remove undefined values

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // In development, allow all origins
        if (process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        // In production, only allow whitelisted origins
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.warn(`⚠️  Blocked request from origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // ✅ Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ✅ Basic health check
  app.get("/", (req, res) => {
    res.json({ 
      status: "OK", 
      message: "✅ Backend is running",
      timestamp: new Date().toISOString()
    });
  });

  // ✅ API health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "OK",
      timestamp: new Date().toISOString()
    });
  });

  // ✅ API Routes - Register BEFORE starting server
  app.use("/api/auth", authRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/requests", groupRequestRoutes);

  // ✅ Connect DB first
  try {
    await connectDB();
    console.log("✅ MySQL Connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    // Don't exit - let server start even if DB fails (for testing)
  }

  // ✅ Start server AFTER routes are registered
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
