const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('./db');
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
    res.end(JSON.stringify({ message: "Login successful!", token, role: user.role }));
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
      layout: busData.layout, 
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

const generateUniqueSeatId = (prefix, row, seat) => `${prefix}-${row}-${seat}`;

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
    const layoutsCollection = db.collection('layouts');

    // Find the bus by ID
    const bus = await busesCollection.findOne({ _id: new ObjectId(busId) });
    if (!bus) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Bus not found." }));
      return;
    }

    // Fetch the layout associated with the bus using layout ID
    const layout = await layoutsCollection.findOne({ _id: new ObjectId(bus.layout) });
    if (!layout || !layout.rightSeats || !layout.leftSeats || !layout.backSeats) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Layout not found or invalid layout structure." }));
      return;
    }

    // Generate unique seat IDs for the layout
    const seatsWithIds = [
      ...layout.rightSeats.map((row, rowIndex) =>
        row.map((seat, seatIndex) => generateUniqueSeatId('R', rowIndex, seatIndex))
      ),
      ...layout.leftSeats.map((row, rowIndex) =>
        row.map((seat, seatIndex) => generateUniqueSeatId('L', rowIndex, seatIndex))
      ),
      layout.backSeats.map((seat, seatIndex) => generateUniqueSeatId('B', 0, seatIndex))
    ];

    // Add layout to each schedule
    const schedulesWithLayout = scheduleData.map(schedule => ({
      ...schedule,
      layout: seatsWithIds,
      bookedSeats: []
    }));

    // Add new schedules to the bus
    await busesCollection.updateOne(
      { _id: new ObjectId(busId) },
      { $push: { schedules: { $each: schedulesWithLayout } } }
    );

    res.statusCode = 201;
    res.end(JSON.stringify({ message: "Schedules added successfully!" }));
  } catch (error) {
    console.error('Error adding schedules:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ message: "Error adding schedules." }));
  }
};

const wss = new WebSocket.Server({ noServer: true });

const bookSeats = async (req, res) => {
  try {
    console.log('Received booking request:', req.body);

    const { busId, scheduleDate, seats, userId } = req.body;

    if (!ObjectId.isValid(busId)) {
      console.log('Invalid bus ID');
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Invalid bus ID." }));
      return;
    }

    const db = await connectDB();
    const busesCollection = db.collection('buses');
    const bus = await busesCollection.findOne({ _id: new ObjectId(busId) });

    if (!bus) {
      console.log('Bus not found');
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Bus not found." }));
      return;
    }

    const schedule = bus.schedules.find(s => s.date === scheduleDate);
    if (!schedule) {
      console.log('Schedule not found');
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Schedule not found." }));
      return;
    }

    // Check if seats are already booked
    const alreadyBookedSeats = schedule.bookedSeats || [];
    const isSeatAvailable = seats.every(seat => !alreadyBookedSeats.some(bookedSeat => bookedSeat.seatId === seat));

    if (!isSeatAvailable) {
      console.log('Some seats are already booked');
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Some seats are already booked." }));
      return;
    }

    // Update booked seats
    const updatedBookedSeats = [
      ...alreadyBookedSeats,
      ...seats.map(seat => ({
        seatId: seat,
        isBooked: true,
        bookedBy: userId,
        seatAvailableState: "Booked"
      }))
    ];

    console.log('Updating booked seats:', updatedBookedSeats);

    await busesCollection.updateOne(
      { _id: new ObjectId(busId), 'schedules.date': scheduleDate },
      { $set: { 'schedules.$.bookedSeats': updatedBookedSeats } }
    );

    console.log('Booked seats updated successfully');

    // Broadcast the update to all connected clients
    const message = JSON.stringify({ busId, scheduleDate, seats: updatedBookedSeats });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log('Broadcast message sent');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: "Seats booked successfully!" }));
  } catch (error) {
    console.error('Error booking seats:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: "Error booking seats." }));
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

module.exports = { loginUser, registerUser, createRoute, getRoutes, addBus, addSchedule, getBuses, registerBusOperator, bookSeats };
