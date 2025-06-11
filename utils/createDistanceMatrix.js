// utils/createDistanceMatrix.js
const distanceCache = require('./distanceCache');

function createDistanceMatrix(locations) {
  const matrix = [];
  
  console.log(`📏 Mesafe matrisi oluşturuluyor (${locations.length}x${locations.length})`);
  
  for (let i = 0; i < locations.length; i++) {
    const row = [];
    for (let j = 0; j < locations.length; j++) {
      if (i === j) {
        row.push(0);
      } else {
        // Cache kullan
        const dist = distanceCache.getDistance(locations[i], locations[j]);
        row.push(dist);
      }
    }
    matrix.push(row);
  }
  
  // Cache istatistiklerini göster
  if (process.env.NODE_ENV === 'development') {
    const stats = distanceCache.getStats();
    console.log(`📊 Cache İstatistikleri:`, stats);
  }
  
  return matrix;
}

module.exports = createDistanceMatrix;