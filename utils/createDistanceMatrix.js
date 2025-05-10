const calculateDistance = require("./distance");

function createDistanceMatrix(locations) {
  const matrix = [];

  for (let i = 0; i < locations.length; i++) {
    const row = [];
    for (let j = 0; j < locations.length; j++) {
      if (i === j) {
        row.push(0);
      } else {
        const dist = calculateDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude
        );
        row.push(dist);
      }
    }
    matrix.push(row);
  }

  return matrix;
}

module.exports = createDistanceMatrix;
