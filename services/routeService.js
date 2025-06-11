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
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function filterAvailableLocations(preference) {
  const locations = generateLocations('data/locations.json');
  const days = preference.getDayStrings();
  console.log('🧾 Gelen Preference:', preference);
  console.log('📅 Günler:', preference.getDayStrings());
  console.log('📂 Category map:', mapCategory(preference.type));
  return locations
  .filter(loc => {
    const categoryMatch = mapCategory(preference.type).includes(loc.category.toLowerCase());
    return categoryMatch;
  })
  .map(loc => ({
    id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    distance_to_start: loc.distance_to_start,
    must_visit: loc.must_visit,
    category: loc.category,
    score: loc.score,
    visit_duration: loc.visit_duration,
    opening_hours: loc.opening_hours,
    rating: loc.rating,
    image_url: loc.image_url  // ✅ En kritik alan burası
  }));
}function mapCategory(type) {
  const validCategories = [
    'cultural',
    'park',
    'food',
    'shopping',
    'education',
    'entertainment',
    'scenic'
  ];

  if (Array.isArray(type)) {
    return type
      .filter((t) => typeof t === 'string' && validCategories.includes(t.toLowerCase()))
      .map((t) => t.toLowerCase());
  }

  if (typeof type === 'string' && validCategories.includes(type.toLowerCase())) {
    return [type.toLowerCase()];
  }
  

  return [];
}


function optimizeRoute(day, startHour, totalHours, selectedCategories, locations, distanceMatrix) {
  const filtered = locations.filter(loc => loc.distance_to_start <= MAX_DISTANCE_THRESHOLD || !loc.must_visit);
  console.log(`genetik algoya başladı'`);
  const bestRoute = geneticAlgorithm(filtered, distanceMatrix, day, startHour, totalHours, selectedCategories);
  const orderedRoute = optimizeRouteOrder(bestRoute, filtered, distanceMatrix);

  const visitTimes = {};
  let currentTime = startHour * 60;
  const endTime = currentTime + totalHours * 60;
  let previous = -1;
  const finalRoute = [];

  for (const idx of orderedRoute) {
    const loc = filtered[idx];
    if (previous !== -1) {
      const distance = distanceMatrix[previous][idx];
      currentTime += distance * TRAVEL_TIME_PER_KM;
    }
    const hours = loc.opening_hours[day];
    if (!hours) continue;
    const [open, close] = hours;
    if (open === -1 || close === -1) continue;
    if (currentTime < open * 60) currentTime = open * 60;
    if ((currentTime + loc.visit_duration > close * 60) || (currentTime + loc.visit_duration > endTime)) continue;
    visitTimes[idx] = currentTime;
    currentTime += loc.visit_duration;
    finalRoute.push(loc);
    previous = idx;
  }

  return [ finalRoute, filtered, visitTimes ];
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
// ✅ createMultiDayRoute fonksiyonu — daha önce senin backend'de tanımladığın yapının düz hali
function createMultiDayRoute({ startDate, endDate, startHour, totalHours, selectedCategory, niceToHavePlaces, startLat, startLon }) {
  const niceToHaveIds = new Set(niceToHavePlaces.map(p => p.id));
  const allLocations = generateLocations("data/locations.json", startLat, startLon);
  let remainingLocations = [...allLocations];

  const dates = getDateRange(startDate, endDate);
  const allRoutes = [];

  for (const travelDate of dates) {
    const day = travelDate.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = travelDate.toISOString().split("T")[0];

    if (remainingLocations.length === 0) {
      allRoutes.push({ date: formattedDate, route: [], message: "No more locations." });
      continue;
    }

    const distanceMatrix = createDistanceMatrix(remainingLocations);
    const bestRoute = geneticAlgorithm(remainingLocations, distanceMatrix, day, startHour, totalHours, selectedCategory, niceToHaveIds);
    const orderedRoute = optimizeRouteOrder(bestRoute, remainingLocations, distanceMatrix);

    const visitTimes = {};
    let currentTime = startHour * 60;
    const endTime = currentTime + totalHours * 60;
    let previous = -1;
    const finalRoute = [];

    for (const idx of orderedRoute) {
      const loc = remainingLocations[idx];
      if (previous !== -1) {
        const dist = distanceMatrix[previous][idx];
        currentTime += dist * TRAVEL_TIME_PER_KM;
      }

      const [open, close] = loc.opening_hours[day] || [-1, -1];
      if (open === -1 || close === -1 || currentTime + loc.visit_duration > close * 60 || currentTime + loc.visit_duration > endTime) {
        continue;
      }

      if (currentTime < open * 60) currentTime = open * 60;

      visitTimes[idx] = currentTime;
      currentTime += loc.visit_duration;
      finalRoute.push({
        id: loc.id,
        name: loc.name,
        category: loc.category,
        mustVisit: niceToHaveIds.has(loc.id),
        latitude: loc.latitude,
        longitude: loc.longitude,
        visitStartTime: formatTime(visitTimes[idx]),
        visitEndTime: formatTime(currentTime),
        image_url: loc.image_url
      });

      previous = idx;
    }

    const usedIds = new Set(finalRoute.map(loc => loc.id));
    remainingLocations = remainingLocations.filter(loc => !usedIds.has(loc.id));

    allRoutes.push({ date: formattedDate, route: finalRoute });
  }

  return allRoutes;
}

module.exports = {
  optimizeRoute,
  getDateRange,
  filterAvailableLocations,
  createMultiDayRoute,
};
