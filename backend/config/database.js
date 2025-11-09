const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

// Create connection pool
const createPool = () => {
  if (pool) {
    return pool;
  }

  try {
    let config;
    
    // Railway provides DATABASE_URL as a connection string
    // Format: mysql://user:password@host:port/database
    if (process.env.DATABASE_URL) {
      try {
        // Parse DATABASE_URL
        const url = new URL(process.env.DATABASE_URL);
        config = {
          host: url.hostname,
          port: parseInt(url.port) || 3306,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1).split('?')[0], // Remove leading '/' and query params
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
        };
        console.log(`✅ Parsed DATABASE_URL for host: ${config.host}`);
      } catch (urlError) {
        console.error("❌ Failed to parse DATABASE_URL:", urlError.message);
        console.log("DATABASE_URL format:", process.env.DATABASE_URL.substring(0, 20) + "...");
        throw new Error("Invalid DATABASE_URL format");
      }
    } else {
      // Fallback to individual env variables for local development
      config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'splitwise',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      };
      console.log("✅ Using individual DB environment variables");
    }
    
    pool = mysql.createPool(config);
    console.log("✅ MySQL Pool Created");
    return pool;
  } catch (err) {
    console.error("❌ Database pool creation failed:", err.message);
    console.error("Error details:", err);
    throw err;
  }
};

// Get the connection pool
const getPool = () => {
  if (!pool) {
    return createPool();
  }
  return pool;
};

// Test database connection
const connectDB = async () => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("✅ MySQL Connected and ready");
    return pool;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    // Don't exit in production - let the server start and retry
    if (process.env.NODE_ENV === 'production') {
      console.warn("⚠️  Continuing without database connection. Some features may not work.");
    } else {
      throw err;
    }
  }
};

module.exports = { connectDB, getPool, createPool };
