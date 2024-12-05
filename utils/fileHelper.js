const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, "..", "data");
const usersFilePath = path.join(dataDir, "users.json");
const busesFilePath = path.join(dataDir, 'buses.json');
const routesFilePath = path.join(dataDir, 'routes.json');

// Function to write data to file
const writeToFile = (filePath, data) => {
  if (!fs.existsSync(dataDir)) {
    // Create the 'data' directory if it doesn't exist
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Function to read data from a file
const readFromFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

module.exports = { readFromFile, writeToFile, usersFilePath, busesFilePath, routesFilePath };
