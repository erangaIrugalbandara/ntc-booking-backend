const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

const connectDB = async () => {
  if (db) return db;
  await client.connect();
  db = client.db('ntc-seat-booking');
  return db;
};

module.exports = connectDB;