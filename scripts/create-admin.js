require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const User = require('../server/database/models/User');

    // Get admin details
    console.log('=== Create Admin Account ===\n');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 characters): ');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('\n❌ User with this email already exists!');
      if (existingUser.role === 'admin') {
        console.log('✅ This user is already an admin.');
      } else {
        const upgrade = await question(`\nThis user is a ${existingUser.role}. Upgrade to admin? (yes/no): `);
        if (upgrade.toLowerCase() === 'yes') {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log('\n✅ User upgraded to admin successfully!');
        }
      }
    } else {
      // Create new admin user
      const newUser = new User({
        email: email.toLowerCase(),
        password: password,
        role: 'admin',
        isActive: true
      });

      await newUser.save();
      console.log('\n✅ Admin account created successfully!');
    }

    console.log('\n=== Admin Login Details ===');
    console.log('Email:', email);
    console.log('Role: admin');
    console.log('\nYou can now login at:');
    console.log('- Local: http://localhost:3000/admin.html');
    console.log('- Live: https://your-app.onrender.com/admin.html');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

createAdmin();
