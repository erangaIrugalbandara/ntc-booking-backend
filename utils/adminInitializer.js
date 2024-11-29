const bcrypt = require('bcrypt');
const { writeToFile, readFromFile, usersFilePath } = require('./fileHelper');

const initializeAdmin = async () => {
  const users = readFromFile(usersFilePath);

  const adminExists = users.some((u) => u.email === 'admin@example.com');

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    };
    users.push(adminUser);
    writeToFile(usersFilePath, users);
    console.log('Default admin account created.');
  }
};

module.exports = { initializeAdmin };