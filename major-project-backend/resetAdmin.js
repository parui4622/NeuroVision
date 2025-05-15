// Script to reset an admin user's password in the database
const mongoose = require('mongoose');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const config = require('./config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  await mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const email = await prompt('Admin Email: ');
  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) {
    console.log('No admin found with this email.');
    rl.close();
    mongoose.disconnect();
    return;
  }
  const newPassword = await prompt('New Password: ');
  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();
  console.log('Admin password reset successfully!');
  rl.close();
  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  rl.close();
  mongoose.disconnect();
});
