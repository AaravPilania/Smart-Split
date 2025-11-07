const mysql = require('mysql2/promise');
require('dotenv').config();

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("✅ MySQL Connected");
    return connection;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
