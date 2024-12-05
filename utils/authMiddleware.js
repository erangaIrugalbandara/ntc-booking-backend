const jwt = require('jsonwebtoken');

const secretKey = 'aP0^&kL!)9vH7#@2XyzR3$mnkQ!23dfx'; 

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    res.statusCode = 403;
    res.end(JSON.stringify({ message: "No token provided." }));
    return;
  }

  jwt.verify(token.split(' ')[1], secretKey, (err, decoded) => {
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