const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('../utils/db');
const WebSocket = require('ws');

const secretKey = process.env.SECRET_KEY;

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, secretKey, { expiresIn: '1h' });
};

const validatePasswordStrength = (password) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

// Register User
const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    console.log('Received user data:', userData);

    if (!validatePasswordStrength(userData.password)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Password is not strong enough." }));
      return;
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    console.log('Hashed Password:', hashedPassword); 

    // Check if user already exists
    const userExists = await usersCollection.findOne({ email: userData.email });

    if (userExists) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "User already exists." }));
      return;
    }

    // Add new user
    const newUser = { ...userData, password: hashedPassword, role: 'commuter' };
    await usersCollection.insertOne(newUser);

    res.statusCode = 201;
    res.end(JSON.stringify({ message: "User registered successfully!" }));
  } catch (error) {
    console.error('Error registering user:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error registering user." }));
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const userData = req.body;

    const db = await connectDB();
    const usersCollection = db.collection('users');

    // Check if user exists
    const user = await usersCollection.findOne({ email: userData.email });

    if (!user) {
      console.log("User not found");
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "Invalid credentials!" }));
      return;
    }

    // Compare hashed passwords
    const passwordMatch = await bcrypt.compare(userData.password, user.password);

    if (!passwordMatch) {
      console.log("Password does not match");
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "Invalid credentials!" }));
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.statusCode = 200;
    res.end(JSON.stringify({ message: "Login successful!", token, userId: user._id, role: user.role }));
  } catch (error) {
    console.error('Error logging in:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error logging in." }));
  }
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

      const db = await connectDB();
      const usersCollection = db.collection('users');

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Check if user already exists
      const userExists = await usersCollection.findOne({ email: userData.email });

      if (userExists) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "User already exists." }));
        return;
      }

      // Add new bus operator
      const newUser = { ...userData, password: hashedPassword, role: 'bus_operator' };
      await usersCollection.insertOne(newUser);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "Bus operator registered successfully!" }));
    } catch (error) {
      console.error('Error registering bus operator:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error registering bus operator." }));
    }
  });
};

module.exports = { loginUser, registerUser, registerBusOperator };