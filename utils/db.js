const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://eranga:para2243047@cluster0.sbpyg.mongodb.net/';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

const connectDB = async () => {
  if (db) return db;
  await client.connect();
  db = client.db('ntc-seat-booking');
  return db;
};

module.exports = connectDB;