const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { writeToFile, readFromFile, usersFilePath } = require('./fileHelper');

const secretKey = 'your_secret_key'; // Replace with your secret key

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey, { expiresIn: '1h' });
};

const validatePasswordStrength = (password) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

// Register User
const registerUser = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const userData = JSON.parse(body);

      if (!validatePasswordStrength(userData.password)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "Password is not strong enough." }));
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Read existing users
      const users = readFromFile(usersFilePath);

      // Check if user already exists
      const userExists = users.some((u) => u.email === userData.email);

      if (userExists) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "User already exists." }));
        return;
      }

      // Add new user
      const newUser = { ...userData, password: hashedPassword, role: 'commuter' };
      users.push(newUser);
      writeToFile(usersFilePath, users);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "User registered successfully!" }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error registering user." }));
    }
  });
};

// Login User
const loginUser = (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const userData = JSON.parse(body);

      // Read existing users
      const users = readFromFile(usersFilePath);

      // Check if user exists
      const user = users.find((u) => u.email === userData.email);

      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: "Invalid credentials!" }));
        return;
      }

      // Compare hashed passwords
      const passwordMatch = await bcrypt.compare(userData.password, user.password);

      if (!passwordMatch) {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: "Invalid credentials!" }));
        return;
      }

      // Generate JWT token
      const token = generateToken(user);

      res.statusCode = 200;
      res.end(JSON.stringify({ message: "Login successful!", token }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error logging in." }));
    }
  });
};

// Register Bus Operator
const registerBusOperator = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const userData = JSON.parse(body);

      if (!validatePasswordStrength(userData.password)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "Password is not strong enough." }));
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Read existing users
      const users = readFromFile(usersFilePath);

      // Check if user already exists
      const userExists = users.some((u) => u.email === userData.email);

      if (userExists) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "User already exists." }));
        return;
      }

      // Add new bus operator
      const newUser = { ...userData, password: hashedPassword, role: 'bus_operator' };
      users.push(newUser);
      writeToFile(usersFilePath, users);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "Bus operator registered successfully!" }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error registering bus operator." }));
    }
  });
};

module.exports = { registerUser, loginUser, registerBusOperator };