const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('./db');

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

      // Add new user
      const newUser = { ...userData, password: hashedPassword, role: 'commuter' };
      await usersCollection.insertOne(newUser);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "User registered successfully!" }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error registering user." }));
    }
  });
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
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error registering bus operator." }));
    }
  });
};

// Create Route
const createRoute = async (req, res) => {
  try {
    const routeData = req.body;

    const db = await connectDB();
    const routesCollection = db.collection('routes');

    // Check if route already exists
    const routeExists = await routesCollection.findOne({ from: routeData.from, to: routeData.to });

    if (routeExists) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Route already exists." }));
      return;
    }

    // Add new route
    const newRoute = { from: routeData.from, to: routeData.to };
    await routesCollection.insertOne(newRoute);

    res.statusCode = 201;
    res.end(JSON.stringify({ message: "Route created successfully!" }));
  } catch (error) {
    console.error('Error creating route:', error); 
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error creating route." }));
  }
};

// Get Routes
const getRoutes = async (req, res) => {
  try {
    const db = await connectDB();
    const routesCollection = db.collection('routes');
    const routes = await routesCollection.find().toArray();
    res.statusCode = 200;
    res.end(JSON.stringify(routes));
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error fetching routes." }));
  }
};

// Add Bus
const addBus = async (req, res) => {
  try {
    const busData = req.body;

    const db = await connectDB();
    const busesCollection = db.collection('buses');

    // Add new bus
    const newBus = { 
      registrationNumber: busData.registrationNumber, 
      from: busData.from, 
      to: busData.to, 
      firstName: busData.firstName, 
      lastName: busData.lastName, 
      email: busData.email, 
      password: await bcrypt.hash(busData.password, 10),
      schedules: [] 
    };
    await busesCollection.insertOne(newBus);

    res.statusCode = 201;
    res.end(JSON.stringify({ message: "Bus added successfully!" }));
  } catch (error) {
    console.error('Error adding bus:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error adding bus." }));
  }
};

// Add Schedule
const addSchedule = async (req, res) => {
  try {
    const busId = req.params.busId;

    // Validate busId
    if (!ObjectId.isValid(busId)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Invalid bus ID." }));
      return;
    }

    const scheduleData = req.body.schedules;

    if (!Array.isArray(scheduleData)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Schedules must be an array." }));
      return;
    }

    const db = await connectDB();
    const busesCollection = db.collection('buses');

    // Find the bus by ID
    const bus = await busesCollection.findOne({ _id: new ObjectId(busId) });
    if (!bus) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Bus not found." }));
      return;
    }

    // Add new schedules to the bus
    await busesCollection.updateOne(
      { _id: new ObjectId(busId) },
      { $push: { schedules: { $each: scheduleData } } }
    );

    res.statusCode = 201;
    res.end(JSON.stringify({ message: "Schedules added successfully!" }));
  } catch (error) {
    console.error('Error adding schedules:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error adding schedules." }));
  }
};

// Get Buses
const getBuses = async (req, res) => {
  try {
    const db = await connectDB();
    const busesCollection = db.collection('buses');
    const buses = await busesCollection.find().toArray();
    res.statusCode = 200;
    res.end(JSON.stringify(buses));
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error fetching buses." }));
  }
};

module.exports = { loginUser, createRoute, getRoutes, addBus, addSchedule, getBuses };