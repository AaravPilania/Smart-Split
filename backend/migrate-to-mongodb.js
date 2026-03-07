require('dotenv').config();
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const GroupRequest = require('./models/GroupRequest');

// MySQL connection config (from your existing .env)
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'splitwise',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;

async function migrateData() {
  let mysqlConnection;
  let mongoConnection;

  try {
    console.log('🔄 Starting data migration from MySQL to MongoDB...');

    // Connect to MySQL
    console.log('📡 Connecting to MySQL...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connected');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');

    // Clear existing MongoDB data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing MongoDB data...');
    await User.deleteMany({});
    await Group.deleteMany({});
    await Expense.deleteMany({});
    await GroupRequest.deleteMany({});

    // Migrate Users
    console.log('👥 Migrating users...');
    const [users] = await mysqlConnection.execute('SELECT * FROM users');
    for (const user of users) {
      const newUser = new User({
        name: user.name,
        email: user.email,
        password: user.password, // Already hashed
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });
      await newUser.save();
      console.log(`   ✅ Migrated user: ${user.email}`);
    }

    // Create a map of old IDs to new ObjectIds
    const userIdMap = {};
    const allUsers = await User.find({});
    allUsers.forEach(user => {
      // Assuming email is unique, find the old user by email
      const oldUser = users.find(u => u.email === user.email);
      if (oldUser) {
        userIdMap[oldUser.id] = user._id;
      }
    });

    // Migrate Groups
    console.log('👥 Migrating groups...');
    const [groups] = await mysqlConnection.execute('SELECT * FROM `groups`');
    for (const group of groups) {
      const members = [];
      if (group.members) {
        // Parse JSON members array
        const memberIds = JSON.parse(group.members);
        memberIds.forEach(id => {
          if (userIdMap[id]) {
            members.push(userIdMap[id]);
          }
        });
      }

      const newGroup = new Group({
        name: group.name,
        description: group.description,
        createdBy: userIdMap[group.created_by],
        members: members,
        createdAt: group.created_at,
        updatedAt: group.updated_at
      });
      await newGroup.save();

      // Add to group ID map
      userIdMap[`group_${group.id}`] = newGroup._id;
      console.log(`   ✅ Migrated group: ${group.name}`);
    }

    // Migrate Expenses
    console.log('💰 Migrating expenses...');
    const [expenses] = await mysqlConnection.execute('SELECT * FROM expenses');
    for (const expense of expenses) {
      const splitBetween = [];
      if (expense.split_between) {
        const splits = JSON.parse(expense.split_between);
        splits.forEach(split => {
          if (userIdMap[split.user_id]) {
            splitBetween.push({
              user: userIdMap[split.user_id],
              amount: split.amount
            });
          }
        });
      }

      const settledBy = [];
      if (expense.settled_by) {
        const settlements = JSON.parse(expense.settled_by);
        settlements.forEach(settlement => {
          if (userIdMap[settlement.user_id]) {
            settledBy.push({
              user: userIdMap[settlement.user_id],
              amount: settlement.amount,
              settledAt: settlement.settled_at
            });
          }
        });
      }

      const newExpense = new Expense({
        title: expense.title,
        amount: expense.amount,
        group: userIdMap[`group_${expense.group_id}`],
        paidBy: userIdMap[expense.paid_by],
        splitBetween: splitBetween,
        settled: expense.settled === 1,
        settledBy: settledBy,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at
      });
      await newExpense.save();
      console.log(`   ✅ Migrated expense: ${expense.title}`);
    }

    // Migrate Group Requests
    console.log('📨 Migrating group requests...');
    const [requests] = await mysqlConnection.execute('SELECT * FROM group_requests');
    for (const request of requests) {
      const newRequest = new GroupRequest({
        group: userIdMap[`group_${request.group_id}`],
        user: userIdMap[request.user_id],
        status: request.status,
        createdAt: request.created_at,
        respondedAt: request.responded_at
      });
      await newRequest.save();
      console.log(`   ✅ Migrated request: ${request.status}`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Groups: ${groups.length}`);
    console.log(`   Expenses: ${expenses.length}`);
    console.log(`   Group Requests: ${requests.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('🔌 MySQL connection closed');
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };