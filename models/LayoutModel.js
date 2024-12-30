const connectDB = require('../utils/db');

const getLayouts = async () => {
  const db = await connectDB();
  return db.collection('layouts').find().toArray();
};

module.exports = { getLayouts };