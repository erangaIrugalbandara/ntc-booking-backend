const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.statusCode = 403;
    res.end(JSON.stringify({ message: "No token provided." }));
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.statusCode = 403;
    res.end(JSON.stringify({ message: "No token provided." }));
    return;
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: "Failed to authenticate token." }));
      return;
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    res.statusCode = 403;
    res.end(JSON.stringify({ message: "Access denied." }));
    return;
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };