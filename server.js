require('dotenv').config();
const http = require("http");
const url = require("url");
const { registerUser, loginUser, registerBusOperator, addBus, createRoute, getRoutes, getBuses, addSchedule, bookSeats } = require("./utils/userController");
const { verifyToken, verifyAdmin } = require("./utils/authMiddleware");
const { initializeAdmin } = require("./utils/adminInitializer");
const { getLayouts, addLayout } = require("./utils/layoutModel");
const connectDB = require('./utils/db.js');
const { ObjectId } = require('mongodb');
const WebSocket = require('ws');

const PORT = process.env.PORT || 5000;

// Initialize default admin account
initializeAdmin();

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse JSON body
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    if (body) {
      try {
        req.body = JSON.parse(body);
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: "Invalid JSON" }));
        return;
      }
    }

    console.log(`Received request: ${method} ${path}`);

    if (path === "/api/users" && method === "POST") {
      console.log("Handling /api/users POST request");
      registerUser(req, res);
    } else if (path === "/api/auth/login" && method === "POST") {
      console.log("Handling /api/auth/login POST request");
      loginUser(req, res);
    } else if (path === "/api/operators" && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, () => {
          registerBusOperator(req, res);
        });
      });
    } else if (path === "/api/buses" && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, async () => {
          try {
            const { registrationNumber, from, to, layout, firstName, lastName, email, password } = req.body;
            const db = await connectDB();
            await db.collection('buses').insertOne({ registrationNumber, from, to, layout, firstName, lastName, email, password });
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: "Bus added successfully" }));
          } catch (error) {
            console.error("Error adding bus:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Error adding bus", error: error.message }));
          }
        });
      });
    } else if (path === "/api/buses" && method === "GET") {
      verifyToken(req, res, () => {
        getBuses(req, res);
      });
    } else if (path === "/api/routes" && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, () => {
          createRoute(req, res);
        });
      });
    } else if (path === "/api/routes" && method === "GET") {
      verifyToken(req, res, () => {
        getRoutes(req, res);
      });
    } else if (path.startsWith("/api/buses/") && path.endsWith("/schedules") && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, async () => {
          const busId = path.split("/")[3];
          req.params = { busId };
          await addSchedule(req, res);
        });
      });
    } else if (path === "/api/layouts" && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, async () => {
          try {
            const layout = generateSeatLayout(req.body);
            console.log("Generated Layout:", layout); 
            
            // Save the layout to the database
            await addLayout(layout);

            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(layout));
          } catch (error) {
            console.error("Error saving layout:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Error saving layout", error: error.message }));
          }
        });
      });
    } else if (path === "/api/layouts" && method === "GET") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, async () => {
          try {
            const layouts = await getLayouts();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(layouts));
          } catch (error) {
            console.error("Error retrieving layouts:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Error retrieving layouts", error: error.message }));
          }
        });
      });
    } else if (path.startsWith('/api/layouts/') && method === 'GET') {
      const layoutId = path.split('/')[3];
      if (!ObjectId.isValid(layoutId)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Invalid layout ID' }));
        return;
      }
      try {
        const db = await connectDB();
        const layoutsCollection = db.collection('layouts');
        const layout = await layoutsCollection.findOne({ _id: new ObjectId(layoutId) });
        if (!layout) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Layout not found' }));
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(layout));
      } catch (error) {
        console.error('Error fetching layout:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Error fetching layout' }));
      }
    } else if (path === "/api/cities" && method === "GET") {
      try {
        const db = await connectDB();
        const busesCollection = db.collection('buses');
        const fromCities = await busesCollection.distinct('from');
        const toCities = await busesCollection.distinct('to');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ fromCities, toCities }));
      } catch (error) {
        console.error("Error fetching cities:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ message: "Error fetching cities", error: error.message }));
      }
    } else if (path === "/api/buses/search" && method === "POST") {
      try {
        const { from, to, date } = req.body;
        const db = await connectDB();
        const busesCollection = db.collection('buses');
        const matchingBuses = await busesCollection.find({
          $or: [
            { from, to, 'schedules.date': date, 'schedules.direction': true },
            { from: to, to: from, 'schedules.date': date, 'schedules.direction': false }
          ]
        }).toArray();
        const busesWithSchedules = matchingBuses.map(bus => {
          const schedule = bus.schedules.find(s => s.date === date && ((s.direction && bus.from === from && bus.to === to) || (!s.direction && bus.from === to && bus.to === from)));
          return {
            ...bus,
            date: schedule.date,
            departureTime: schedule.departureTime,
            arrivalTime: schedule.arrivalTime,
            direction: schedule.direction
          };
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(busesWithSchedules));
      } catch (error) {
        console.error("Error fetching matching buses:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ message: "Error fetching matching buses", error: error.message }));
      }
    } else if (path === '/api/bookings' && method === 'POST') {
      await bookSeats(req, res);
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Route not found' }));
    }
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connected');
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const generateSeatLayout = ({ layoutName, rightSide, leftSide, backSeat }) => {
  const rightSeats = Array(rightSide.rows).fill().map(() => Array(rightSide.seatsPerRow).fill('R'));
  const leftSeats = Array(leftSide.rows).fill().map(() => Array(leftSide.seatsPerRow).fill('L'));
  const backSeats = Array(backSeat.seats).fill('B');

  return { layoutName, rightSeats, leftSeats, backSeats };
};

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});