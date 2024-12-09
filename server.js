require('dotenv').config();
const http = require("http");
const url = require("url");
const { registerUser, loginUser, registerBusOperator, addBus, createRoute, getRoutes, addSchedule, getBuses } = require("./utils/userController");
const { verifyToken, verifyAdmin } = require("./utils/authMiddleware");
const { initializeAdmin } = require("./utils/adminInitializer");

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

  req.on("end", () => {
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
    } else if (path === "/api/buses" && method === "GET") {
      verifyToken(req, res, () => {
        getBuses(req, res);
      });
    } else if (path.startsWith("/api/buses/") && path.endsWith("/schedules") && method === "POST") {
      verifyToken(req, res, () => {
        verifyAdmin(req, res, () => {
          const busId = path.split("/")[3];
          req.params = { busId }; 
          addSchedule(req, res);
        });
      });
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Route not found" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});