const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  try {
    const dbName = process.env.DB_NAME || 'splitwise';
    
    // First connect without database
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server');
    
    // Check if database exists
    const [databases] = await tempConnection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );
    
    if (databases.length === 0) {
      console.log('❌ Database does not exist. Creating...');
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
      console.log('✅ Database created');
    } else {
      console.log('✅ Database exists');
    }

    await tempConnection.end();

    // Now connect to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName
    });

    console.log(`Connected to database: ${dbName}\n`);

    // Check tables
    const requiredTables = ['users', 'groups', 'group_members', 'expenses', 'expense_splits', 'expense_settlements'];
    
    for (const tableName of requiredTables) {
      const [tables] = await connection.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME || 'splitwise', tableName]
      );
      
      if (tables.length > 0) {
        console.log(`✅ Table '${tableName}' exists`);
      } else {
        console.log(`❌ Table '${tableName}' does NOT exist`);
      }
    }

    // Get table counts
    console.log('\n📊 Table Record Counts:');
    for (const tableName of requiredTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   ${tableName}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`   ${tableName}: Error reading count`);
      }
    }

    await connection.end();
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   MySQL server is not running or not accessible');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Access denied. Check your DB_USER and DB_PASSWORD in .env');
    }
    process.exit(1);
  }
}

checkTables();

