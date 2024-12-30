const { ObjectId } = require('mongodb');
const connectDB = require('../utils/db');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

const bookSeats = async (req, res) => {
  try {
    console.log('Received booking request:', req.body);

    const { busId, scheduleDate, seats, userId } = req.body;

    if (!ObjectId.isValid(busId)) {
      console.log('Invalid bus ID');
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Invalid bus ID." }));
      return;
    }

    if (!ObjectId.isValid(userId)) {
      console.log('Invalid user ID');
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Invalid user ID." }));
      return;
    }

    const db = await connectDB();
    const busesCollection = db.collection('buses');
    const bus = await busesCollection.findOne({ _id: new ObjectId(busId) });

    if (!bus) {
      console.log('Bus not found');
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Bus not found." }));
      return;
    }

    const schedule = bus.schedules.find(s => s.date === scheduleDate);
    if (!schedule) {
      console.log('Schedule not found');
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Schedule not found." }));
      return;
    }

    // Check if seats are already booked
    const alreadyBookedSeats = schedule.bookedSeats || [];
    const isSeatAvailable = seats.every(seat => !alreadyBookedSeats.some(bookedSeat => bookedSeat.seatId === seat));

    if (!isSeatAvailable) {
      console.log('Some seats are already booked');
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Some seats are already booked." }));
      return;
    }

    // Update booked seats
    const updatedBookedSeats = [
      ...alreadyBookedSeats,
      ...seats.map(seat => ({
        seatId: seat,
        isBooked: true,
        bookedBy: new ObjectId(userId),
        seatAvailableState: "Booked"
      }))
    ];

    console.log('Updating booked seats:', updatedBookedSeats);

    await busesCollection.updateOne(
      { _id: new ObjectId(busId), 'schedules.date': scheduleDate },
      { $set: { 'schedules.$.bookedSeats': updatedBookedSeats } }
    );

    console.log('Booked seats updated successfully');

    // Broadcast the update to all connected clients
    const message = JSON.stringify({ busId, scheduleDate, seats: updatedBookedSeats });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log('Broadcast message sent');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: "Seats booked successfully!" }));
  } catch (error) {
    console.error('Error booking seats:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: "Error booking seats." }));
  }
};

module.exports = { bookSeats };