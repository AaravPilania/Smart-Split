const User = require('./models/User');
const { connectDB } = require('./config/database');
require('dotenv').config();

async function addSampleUser() {
  try {
    await connectDB();
    
    // Check if user already exists
    const existing = await User.findByEmail('arav@porn.com');
    if (existing) {
      console.log('✅ Sample user already exists!');
      console.log('Email: arav@porn.com');
      console.log('Password: password');
      return;
    }
    
    // Create sample user
    const user = await User.create('arav@porn.com', 'password', 'Arav');
    
    console.log('✅ Sample user created successfully!');
    console.log('Email: arav@porn.com');
    console.log('Password: password');
    console.log('Name: Arav');
    console.log('ID:', user.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample user:', error.message);
    process.exit(1);
  }
}

addSampleUser();

