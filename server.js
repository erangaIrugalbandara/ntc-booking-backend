const http = require('http');
const url = require('url');
const { registerUser, loginUser } = require('./utils/userController');
const { createRoute, getRoutes } = require('./utils/routeController');

const PORT = 5000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Content-Type', 'application/json');

  if (path === '/api/register' && method === 'POST') {
    registerUser(req, res);
  } else if (path === '/api/login' && method === 'POST') {
    loginUser(req, res);
  } else if (path === '/api/routes' && method === 'POST') {
    createRoute(req, res);
  } else if (path === '/api/routes' && method === 'GET') {
    getRoutes(req, res);
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Route not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
