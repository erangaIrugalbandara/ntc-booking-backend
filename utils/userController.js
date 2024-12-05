const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { writeToFile, readFromFile, usersFilePath, busesFilePath, routesFilePath } = require('./fileHelper');

const secretKey = 'aP0^&kL!)9vH7#@2XyzR3$mnkQ!23dfx'; 

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

// Create Route
const createRoute = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const routeData = JSON.parse(body);

      // Read existing routes
      const routes = readFromFile(routesFilePath);

      // Check if route already exists
      const routeExists = routes.some((r) => r.from === routeData.from && r.to === routeData.to);

      if (routeExists) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "Route already exists." }));
        return;
      }

      // Add new route
      const newRoute = { from: routeData.from, to: routeData.to };
      routes.push(newRoute);
      writeToFile(routesFilePath, routes);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "Route created successfully!" }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error creating route." }));
    }
  });
};

// Get Routes
const getRoutes = (req, res) => {
  try {
    const routes = readFromFile(routesFilePath);
    res.statusCode = 200;
    res.end(JSON.stringify(routes));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error fetching routes." }));
  }
};

// Add Bus
const addBus = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const busData = JSON.parse(body);

      if (!validatePasswordStrength(busData.password)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "Password is not strong enough." }));
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(busData.password, 10);

      // Read existing users
      const users = readFromFile(usersFilePath);

      // Check if bus operator already exists
      const userExists = users.some((u) => u.email === busData.email);

      if (userExists) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "Bus operator already exists." }));
        return;
      }

      // Add new bus operator
      const newUser = { 
        firstName: busData.firstName, 
        lastName: busData.lastName, 
        email: busData.email, 
        password: hashedPassword, 
        role: 'bus_operator' 
      };
      users.push(newUser);
      writeToFile(usersFilePath, users);

      // Read existing buses
      const buses = readFromFile(busesFilePath);

      // Read existing routes
      const routes = readFromFile(routesFilePath);

      // Check if route exists
      const route = routes.find(r => r.from === busData.from && r.to === busData.to);
      if (!route) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "Route does not exist." }));
        return;
      }

      // Add new bus
      const newBus = { 
        id: buses.length + 1, // Assign a unique ID to the bus
        registrationNumber: busData.registrationNumber, 
        route: route, 
        schedules: [], // Initialize with an empty array
        operator: newUser 
      };
      buses.push(newBus);
      writeToFile(busesFilePath, buses);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "Bus added successfully!" }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error adding bus." }));
    }
  });
};

// Add Schedule
const addSchedule = async (req, res, busId) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const scheduleData = JSON.parse(body);

      // Read existing buses
      const buses = readFromFile(busesFilePath);

      // Find the bus by ID
      const bus = buses.find(b => b.id === parseInt(busId));
      if (!bus) {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "Bus not found." }));
        return;
      }

      // Add new schedules to the bus
      bus.schedules.push(...scheduleData.schedules);
      writeToFile(busesFilePath, buses);

      res.statusCode = 201;
      res.end(JSON.stringify({ message: "Schedules added successfully!" }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Error adding schedules." }));
    }
  });
};

module.exports = { registerUser, loginUser, registerBusOperator, createRoute, getRoutes, addBus, addSchedule };