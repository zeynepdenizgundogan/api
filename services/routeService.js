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
  /*return locations.filter(loc => {
    // En az 1 gün açık olması gerekiyor
    // Kategori eşleşmesi
    const categoryMatch = mapCategory(preference.type).includes(loc.category.toLowerCase());

    return  categoryMatch;
  });*/
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
function createMultiDayRoute({ startDate, endDate, startHora, totalHours, selectedCategory, niceToHavePlaces, startLat, startLon }) {
  console.log('🚀 createMultiDayRoute başladı');
  let allLocations = generateLocations("data/locations.json", startLat, startLon);

  // niceToHavePlaces'i must_visit olarak işaretle
  if (niceToHavePlaces && niceToHavePlaces.length > 0) {
    console.log('📥 niceToHavePlaces:', niceToHavePlaces.map(p => ({ id: p.id, type: typeof p.id, value: p.id })));
    console.log('📋 allLocations sample:', allLocations.slice(0, 5).map(loc => ({ id: loc.id, type: typeof loc.id, value: loc.id })));
    allLocations = allLocations.map((loc) => {
      const isNiceToHave = niceToHavePlaces.some((place) => {
        const match = String(place.id) === String(loc.id);
        console.log(`🔍 Comparing: place.id=${place.id} (type: ${typeof place.id}), loc.id=${loc.id} (type: ${typeof loc.id}), match=${match}`);
        return match;
      });
      return {
        ...loc,
        must_visit: isNiceToHave || loc.must_visit
      };
    });
  } else {
    console.log('⚠️ niceToHavePlaces boş veya tanımsız');
  }

  console.log('📍 Must-visit locations:', allLocations.filter(loc => loc.must_visit).map(loc => ({ id: loc.id, name: loc.name })));

  let remainingLocations = [...allLocations];
  const dates = getDateRange(startDate, endDate);
  const allRoutes = [];

  console.log('📅 Tarih aralığı:', dates);

  for (const travelDate of dates) {
    const day = travelDate.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = travelDate.toISOString().split("T")[0];
    console.log(`🗓️ İşleniyor: ${formattedDate} (${day})`);

    if (remainingLocations.length === 0) {
      console.log('⚠️ Kalan lokasyon yok');
      allRoutes.push({
        date: formattedDate,
        message: "Tüm lokasyonlar kullanıldı, rota oluşturulamadı.",
        route: []
      });
      continue;
    }

    console.log('📏 Mesafe matrisi oluşturuluyor');
    const distanceMatrix = createDistanceMatrix(remainingLocations);
    console.log('🧬 optimizeRoute çağrılıyor');
    const [optimizedRoute, _, visitTimes] = optimizeRoute(
      day,
      startHour,
      totalHours,
      selectedCategory,
      remainingLocations,
      distanceMatrix
    );
    console.log('✅ optimizeRoute tamamlandı, rota uzunluğu:', optimizedRoute.length);

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
        image_url: loc.image_url
      };
    });

    const usedIds = new Set(optimizedRoute.map(loc => loc.id));
    remainingLocations = remainingLocations.filter(loc => !usedIds.has(loc.id));

    allRoutes.push({
      date: formattedDate,
      route: routeLocations
    });
    console.log(`✅ ${formattedDate} rotası oluşturuldu, lokasyon sayısı: ${routeLocations.length}`);
  }

  console.log('🚀 createMultiDayRoute tamamlandı');
  return allRoutes;
}

module.exports = {
  optimizeRoute,
  getDateRange,
  optimizeRouteFromPreference,
  filterAvailableLocations,
  createMultiDayRoute,
};
