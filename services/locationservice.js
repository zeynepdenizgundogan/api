const fs = require("fs");
const path = require("path");
const Location = require("../models/location");
const calculateDistance = require("../utils/distance");

function generateLocations(filePath = "data/locations.json", startLat, startLon) {
  const absolutePath = path.join(__dirname, "..", filePath);
  const rawData = fs.readFileSync(absolutePath, "utf-8");
  const data = JSON.parse(rawData);

  const locations = data.map((loc) => {
    const distance_to_start = calculateDistance(startLat, startLon, loc.latitude, loc.longitude);
    return new Location({
      ...loc,
      distance_to_start
    });
  });

  return locations;
}

module.exports = {
  generateLocations,
};