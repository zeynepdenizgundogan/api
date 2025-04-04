const fs = require('fs');
const Location = require('../models/location');
const { calculateDistance } = require('../utils/distance');
const { geneticAlgorithm } = require('./geneticAlgorithm');
const { optimizeRouteOrder } = require('../utils/optimizeRouteOrder');
const { filterValidRoute } = require('../utils/filterValidRoute');


const path = require('path');
const { getDayStrings } = require('../models/preferences');

// Lokasyonları JSON dosyasından oku
function generateLocations(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data.map(loc => new Location(loc));
}

// Mesafe matrisi oluştur
function createDistanceMatrix(locations) {
  return locations.map(from =>
    locations.map(to =>
      from.id === to.id ? 0 : calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude)
    )
  );
}

// Ana rota oluşturma servisi
function createRoute(preference) {
  const locations = generateLocations('data/locations.json');
  const distanceMatrix = createDistanceMatrix(locations);

  const days = preference.getDayStrings();
  const startHour = 10; // sabit, istersen preference içinden de alabilirsin
  const totalHours = 7;
  const selectedCategory = preference.type;

  const allRoutes = [];

  for (let day of days) {
    // Genetik algoritma ile rota üret
    const bestRouteIndices = geneticAlgorithm(
      locations, distanceMatrix, day, startHour, totalHours, selectedCategory
    );

    // Rota sırasını optimize et
    const orderedRouteIndices = optimizeRouteOrder(bestRouteIndices, locations, distanceMatrix);

    // Uygun lokasyonları filtrele ve zamanla eşleştir
    const [validRouteIndices, visitTimes] = filterValidRoute(
      orderedRouteIndices, locations, distanceMatrix, day, startHour, totalHours
    );

    // Dönüş: sadece valid lokasyonların bilgisi
    const routeLocations = validRouteIndices.map(index => {
      const loc = locations[index];
      const start = visitTimes[index];
      const end = start + loc.visitDuration;

      return {
        id: loc.id,
        name: loc.name,
        category: loc.category,
        mustVisit: loc.mustVisit,
        latitude: loc.latitude,
        longitude: loc.longitude,
        visitStartTime: formatTime(start),
        visitEndTime: formatTime(end),
      };
    });

    allRoutes.push({
      day,
      route: routeLocations
    });
  }

  return allRoutes;
}

// Dakika cinsinden zamanı HH:mm string'e çevir
function formatTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = Math.floor(minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
function filterAvailableLocations(preference) {
  const locations = generateLocations('data/locations.json');
  const days = preference.getDayStrings();
  console.log('🧾 Gelen Preference:', preference);
  console.log('📅 Günler:', preference.getDayStrings());
  console.log('📂 Category map:', mapCategory(preference.type));
  return locations.filter(loc => {
    // En az 1 gün açık olması gerekiyor
   /* const isOpenOnSomeDay = days.some(day => {
      const hours = loc.opening_hours?.[day]; // ✅ güvenli erişim
      return Array.isArray(hours) && hours[0] !== -1 && hours[1] !== -1;
    });
*/
    // Kategori eşleşmesi
    const categoryMatch = mapCategory(preference.type).includes(loc.category.toLowerCase());

    return  categoryMatch;
  });
}
function mapCategory(type) {
  const map = {
    museum: ['cultural', 'historical','museum'],
    food: ['food','drink','restaurant'],
    park: ['park'],
    shopping: ['mall','shopping'],
    historic: ['historical','historic']
  };
  return map[type?.toLowerCase()] || []; // ✅ güvenli erişim ve küçük harfe çevir
}

module.exports = { 
  createRoute,
  filterAvailableLocations
};
