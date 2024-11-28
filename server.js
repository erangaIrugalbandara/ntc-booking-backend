const http = require("http");
const url = require("url");
const { registerUser, loginUser } = require("./utils/userController");
const verifyToken = require("./utils/authMiddleware");

const PORT = 5000;

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

  if (path === "/api/users" && method === "POST") {
    registerUser(req, res);
  } else if (path === "/api/auth/login" && method === "POST") {
    loginUser(req, res);
  } else if (path === "/api/protected" && method === "GET") {
    verifyToken(req, res, () => {
      // Handle protected route
      res.statusCode = 200;
      res.end(JSON.stringify({ message: "This is a protected route." }));
    });
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});