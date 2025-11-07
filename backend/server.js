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
  const db = await connectDB(); // Wait for DB

  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/requests", groupRequestRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}

startServer();
