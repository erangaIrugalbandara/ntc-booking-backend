const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('../utils/db');
const WebSocket = require('ws');

const generateUniqueSeatId = (prefix, row, seat) => `${prefix}-${row}-${seat}`;

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

  module.exports = { addBus, addSchedule, getBuses };