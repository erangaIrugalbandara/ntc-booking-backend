const connectDB = require('../utils/db');

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

  module.exports = { createRoute, getRoutes };