// Script to create an admin user in the database
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

  const name = await prompt('Admin Name: ');
  const email = await prompt('Admin Email: ');
  const password = await prompt('Admin Password: ');

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email, role: 'admin' });
  if (existing) {
    console.log('Admin with this email already exists.');
    rl.close();
    mongoose.disconnect();
    return;
  }

  // Remove any user with this email (admin or not)
  await User.deleteMany({ email });

  const admin = new User({
    name,
    email,
    password: hashedPassword,
    role: 'admin'
  });
  await admin.save();
  console.log('Admin created successfully!');
  rl.close();
  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  rl.close();
  mongoose.disconnect();
});
