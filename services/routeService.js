const geneticAlgorithm = require("./geneticAlgorithm");
const {generateLocations} = require("./locationservice");
const optimizeRouteOrder = require("../utils/optimizeRouteOrder");
const createDistanceMatrix = require("../utils/createDistanceMatrix");
const { TRAVEL_TIME_PER_KM, MAX_DISTANCE_THRESHOLD } = require("../utils/constants");
const {
  DEFAULT_START_HOUR,
  DEFAULT_TOTAL_HOURS
} = require("../utils/constants");

startHour = DEFAULT_START_HOUR;
totalHours = DEFAULT_TOTAL_HOURS;

function filterAvailableLocations(preference) {
  const locations = generateLocations('data/locations.json');
  const days = preference.getDayStrings();
  console.log('🧾 Gelen Preference:', preference);
  console.log('📅 Günler:', preference.getDayStrings());
  console.log('📂 Category map:', mapCategory(preference.type));
  return locations.filter(loc => {
    // En az 1 gün açık olması gerekiyor
    // Kategori eşleşmesi
    const categoryMatch = mapCategory(preference.type).includes(loc.category.toLowerCase());

    return  categoryMatch;
  });
}
function mapCategory(type) {
  const map = {
    Museum: ['museum'],
    Historic: ['tourist_attraction', 'place_of_worship', 'art_gallery', 'historic', 'historical'],
    Park: ['park'],
    Food: ['restaurant', 'food', 'drink', 'cafe', 'bakery', 'bar'],
    Shopping: ['store', 'shopping', 'mall', 'lodging']
  };
  return map[type?.toLowerCase()] || []; // ✅ güvenli erişim ve küçük harfe çevir
}

function optimizeRouteFromPreference(preference) {
  const dayStrings = preference.getDayStrings();
  const dateList = getDateRange(preference.startDate, preference.endDate);

  // Lokasyonları önceden filtrele
  const availableLocations = preference.filterAvailableLocations(); // örnek fonksiyon

  let remainingLocations = [...availableLocations];
  const results = [];

  for (let i = 0; i < dateList.length; i++) {
    const day = dayStrings[i];
    const date = dateList[i];

    if (remainingLocations.length === 0) {
      results.push({
        day,
        date,
        route: [],
        visitTimes: {}
      });
      continue;
    }

    const distanceMatrix = createDistanceMatrix(remainingLocations);
    const [finalRoute, _, visitTimes] = optimizeRoute(
      day,
      preference.startHour,
      preference.totalHours,
      preference.category,
      remainingLocations,
      distanceMatrix
    );

    results.push({
      day,
      date,
      route: finalRoute,
      visitTimes
    });

    const usedIds = new Set(finalRoute.map(loc => loc.id));
    remainingLocations = remainingLocations.filter(loc => !usedIds.has(loc.id));
  }

  return results;
}

function optimizeRoute(day, startHour, totalHours, selectedCategory, locations, distanceMatrix) {
  // 🔥 Başta uzak lokasyonları filtrele
  locations = locations.filter(loc => loc.distance_to_start <= MAX_DISTANCE_THRESHOLD || !loc.must_visit);

  const bestRoute = geneticAlgorithm(locations, distanceMatrix, day, startHour, totalHours, selectedCategory);
  const optimizedRoute = optimizeRouteOrder(bestRoute, locations, distanceMatrix);

  const visitTimes = {};
  let currentTime = startHour * 60;
  const endTime = currentTime + (totalHours * 60);
  let previousIdx = -1;
  const finalRoute = [];

  for (const idx of optimizedRoute) {
    const loc = locations[idx];

    if (previousIdx !== -1) {
      const travelDistance = distanceMatrix[previousIdx][idx];
      const travelTime = travelDistance * TRAVEL_TIME_PER_KM;
      currentTime += travelTime;
    }

    const [openTime, closeTime] = loc.opening_hours?.[day] || [-1, -1];
    if (openTime === -1 || closeTime === -1) continue;

    if (currentTime < openTime * 60) currentTime = openTime * 60;
    if ((currentTime + loc.visit_duration) > closeTime * 60) continue;
    if ((currentTime + loc.visit_duration) > endTime) continue;

    visitTimes[idx] = currentTime;
    currentTime += loc.visit_duration;
    finalRoute.push(loc);
    previousIdx = idx;
  }

  return [finalRoute, locations, visitTimes];
}

function getDateRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Sadece tarih kısmını karşılaştırmak için saatleri sıfırla
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}
function formatTime(mins) {
  const totalSeconds = Math.round(mins * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}.${String(s).padStart(2, "0")}`;
}
function createMultiDayRoute({ startDate, endDate, startHour, totalHours, selectedCategory }) {
  const allLocations = generateLocations("data/locations.json");
  let remainingLocations = [...allLocations];
  const dates = getDateRange(startDate, endDate);
  const allRoutes = [];

  for (const travelDate of dates) {
    const day = travelDate.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = travelDate.toISOString().split("T")[0];

    if (remainingLocations.length === 0) {
      allRoutes.push({
        date: formattedDate,
        message: "Tüm lokasyonlar kullanıldı, rota oluşturulamadı.",
        route: []
      });
      continue;
    }

    const distanceMatrix = createDistanceMatrix(remainingLocations);
    const [optimizedRoute, _, visitTimes] = optimizeRoute(
      day,
      startHour,
      totalHours,
      selectedCategory,
      remainingLocations,
      distanceMatrix
    );

    const routeLocations = optimizedRoute.map(loc => {
      const idx = remainingLocations.findIndex(l => l.id === loc.id);
      const start = visitTimes[idx];
      const end = start + loc.visit_duration;

      return {
        id: loc.id,
        name: loc.name,
        category: loc.category,
        mustVisit: loc.must_visit,
        latitude: loc.latitude,
        longitude: loc.longitude,
        visitStartTime: formatTime(start),
        visitEndTime: formatTime(end),
      };
    });

    const usedIds = new Set(optimizedRoute.map(loc => loc.id));
    remainingLocations = remainingLocations.filter(loc => !usedIds.has(loc.id));

    allRoutes.push({
      date: formattedDate,
      route: routeLocations
    });
  }

  return allRoutes;
}

module.exports = {
  optimizeRoute,
  getDateRange,
  optimizeRouteFromPreference,
  filterAvailableLocations,
  createMultiDayRoute,
};
