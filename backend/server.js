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

  // ✅ HEALTH CHECK BEFORE ANYTHING
  app.get("/", (req, res) => {
    res.send("✅ Backend is running");
  });

  // ✅ FIXED CORS
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

  // ✅ START SERVER FIRST (Fix #1 + required for Railway)
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${
