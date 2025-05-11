const { getMongoLocations } = require('./mongoService');

const initLocation = {
  lat: 41.0086,
  lng: 28.9802 // şimdilik sabit
};

async function generateLocations(preference) {
  return await getMongoLocations(preference, initLocation);
}

module.exports = {
  generateLocations
};
