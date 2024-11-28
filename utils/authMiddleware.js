const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key'; // Replace with your secret key

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

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
    next();
  });
};

module.exports = verifyToken;