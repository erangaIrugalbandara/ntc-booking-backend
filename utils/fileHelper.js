const path = require("path");
const fs = require("fs");

// Get the absolute path to the 'data' folder
const dataDir = path.join(__dirname, "..", "data");
const usersFilePath = path.join(dataDir, "users.json");

// Function to write data to file
const writeToFile = (filePath, data) => {
  if (!fs.existsSync(dataDir)) {
    // Create the 'data' directory if it doesn't exist
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
};

// Function to read data from a file
const readFromFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileData);
  }
  return [];
};

module.exports = { writeToFile, readFromFile, usersFilePath };
