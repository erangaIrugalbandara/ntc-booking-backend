const bcrypt = require('bcrypt');
const connectDB = require('./db');

const initializeAdmin = async () => {
  const db = await connectDB();
  const usersCollection = db.collection('users');

  const adminExists = await usersCollection.findOne({ email: 'admin@example.com' });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    };
    await usersCollection.insertOne(adminUser);
    console.log('Default admin account created.');
  }
};

module.exports = { initializeAdmin };