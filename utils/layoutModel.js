const connectDB = require('./db');

const getLayouts = async () => {
  const db = await connectDB();
  return db.collection('layouts').find().toArray();
};

module.exports = { getLayouts };