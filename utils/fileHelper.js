const fs = require('fs');
const path = require('path');

// Helper to read from a file
const readFromFile = (filename) => {
  const filePath = path.join(__dirname, '../data', filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
};

// Helper to write to a file
const writeToFile = (filename, data) => {
  const filePath = path.join(__dirname, '../data', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = { readFromFile, writeToFile };
