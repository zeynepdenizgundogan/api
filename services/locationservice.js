const fs = require("fs");
const path = require("path");
const Location = require("../models/location");

function generateLocations(filePath = "locations.json") {
  const absolutePath = path.join(__dirname, "..", filePath);
  const rawData = fs.readFileSync(absolutePath, "utf-8");
  const data = JSON.parse(rawData);

  const locations = data.map((loc) => new Location(loc));
  return locations;
}

module.exports = {
  generateLocations
};
