require('dotenv').config();
const http = require("http");
const url = require("url");
const { registerUser, loginUser, registerBusOperator, addBus, createRoute, getRoutes, addSchedule, getBuses } = require("./utils/userController");
const { verifyToken, verifyAdmin } = require("./utils/authMiddleware");
const { initializeAdmin } = require("./utils/adminInitializer");
const connectDB = require('./utils/db.js');
const { getLayouts } = require('./utils/layoutModel.js');

const PORT = process.env.PORT || 5000;

// Initialize default admin account
initializeAdmin();

const server = http.createServer((req, res) => {
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

    if (path === "/api/users" && method === "POST") {
      registerUser(req, res);
    } else if (path === "/api/auth/login" && method === "POST") {
      loginUser(req, res);
    } else if (path === "/api/operators" && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, () => {
          registerBusOperator(req, res);
        });
      });
    } else if (path === "/api/buses" && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, () => {
          addBus(req, res);
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
        verifyAdmin(req, res, () => {
          const busId = path.split("/")[3];
          req.params = { busId }; 
          addSchedule(req, res);
        });
      });
    } else if (path === "/api/layouts" && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, async () => {
          try {
            const layout = generateSeatLayout(req.body);
            console.log("Generated Layout:", layout); // Log the generated layout
            
            // Save the layout to the database
            const db = await connectDB();
            await db.collection('layouts').insertOne(layout);

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
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "404 not found" }));
    }
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