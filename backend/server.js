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

  // ✅ Basic health check
  app.get("/", (req, res) => {
    res.send("✅ Backend is running");
  });

  // ✅ CORS FIX
  app.use(
    cors({
      origin: [
        "https://thesmartsplit.netlify.app",
        "https://smart-split-production.up.railway.app",
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ✅ Start server first
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });

  // ✅ Connect DB after server starts
  try {
    await connectDB();
    console.log("✅ MySQL Connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }

  // ✅ API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/requests", groupRequestRoutes);

  // ✅ API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
  });
}

startServer();
