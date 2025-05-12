const fs = require("fs");
const path = require("path");
const Location = require("../models/location");
const calculateDistance = require("../utils/distance");

function generateLocations(filePath = "data/locations.json", startLat = 41.0370, startLon = 28.9850) {
  const absolutePath = path.join(__dirname, "..", filePath);
  const rawData = fs.readFileSync(absolutePath, "utf-8");
  const data = JSON.parse(rawData);

  const locations = data.map((loc) => new Location({
    ...loc,
    distance_to_start: calculateDistance(startLat, startLon, loc.latitude, loc.longitude),
  }));


  return locations;
}

module.exports = {
  generateLocations,
};