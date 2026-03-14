require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function resetAdminPassword() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ojt-platform';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const User = require('../server/database/models/User');

    console.log('=== Reset Admin Password ===\n');
    const email = (await question('Enter admin email: ')).toLowerCase().trim();

    if (!email) {
      throw new Error('Email is required.');
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('No user found with that email.');
    }

    if (user.role !== 'admin') {
      const upgrade = (await question(`User role is "${user.role}". Upgrade to admin and continue? (yes/no): `)).toLowerCase().trim();
      if (upgrade !== 'yes') {
        throw new Error('Cancelled by user.');
      }
      user.role = 'admin';
    }

    const newPassword = await question('Enter new password (min 6 chars): ');
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const confirmPassword = await question('Confirm new password: ');
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    user.password = newPassword;
    user.isActive = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    console.log('\n✅ Admin password reset successfully.');
    console.log(`Email: ${user.email}`);
    console.log('Role: admin');
    console.log('\nYou can now log in again.');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

resetAdminPassword();
