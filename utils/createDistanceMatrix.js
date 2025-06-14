const calculateDistance = require("./distance");
function createDistanceMatrix(locations) {
  return locations.map(loc1 =>
    locations.map(loc2 =>
      loc1 === loc2 ? 0 : calculateDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude)
    )
  );
}

module.exports = createDistanceMatrix;
