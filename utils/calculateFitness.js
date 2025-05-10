const { TRAVEL_TIME_PER_KM, MAX_DISTANCE_THRESHOLD } = require("./constants");
const { DEFAULT_START_HOUR, DEFAULT_TOTAL_HOURS } = require("../utils/constants");
const fs = require("fs");

function logToFile(content) {
  fs.appendFileSync("fitness-log.txt", `[${new Date().toISOString()}] ${content}\n`);
}

function calculateFitness(route, locations, distanceMatrix, day, startHour = DEFAULT_START_HOUR, totalHours = DEFAULT_TOTAL_HOURS, selectedCategories) {
  logToFile("calculateFitness CALLED");
  logToFile("DAY: " + day);
  logToFile("ROUTE: " + JSON.stringify(route));
  logToFile("OPENING_HOURS: " + JSON.stringify(locations?.[route?.[0]]?.opening_hours));

  if (!route || route.length === 0) return -1000;
  if (route.length === 1) return 10;

  let totalDistance = 0;
  let totalScore = 0;
  let currentTime = startHour * 60;
  const totalMinutes = totalHours * 60;
  let previousLocationIndex = -1;
  let niceToHaveBonus = 0;

  // 🔄 Tüm lokasyonlar arasında seçilen kategorilere uyanların indeksleri
  const categoryLocations = locations.map((loc, i) => ({ loc, i }))
    .filter(({ loc }) => {
      const cats = Array.isArray(loc.category) ? loc.category : [loc.category];
      return cats.some(cat => selectedCategories.includes(cat.toLowerCase()));
    })
    .map(({ i }) => i);

  const categoryInRoute = categoryLocations.filter(idx => route.includes(idx)).length;
  const categoryRatio = categoryLocations.length > 0 ? categoryInRoute / categoryLocations.length : 1.0;

  for (let i = 0; i < route.length; i++) {
    const locationIndex = route[i];
    const location = locations[locationIndex];

    if (previousLocationIndex !== -1) {
      const travelDistance = distanceMatrix[previousLocationIndex][locationIndex];
      const travelTime = travelDistance * TRAVEL_TIME_PER_KM;
      currentTime += travelTime;
      totalDistance += travelDistance;
    }

    const openClose = location.opening_hours?.[day];
    if (!openClose) return -1000;

    const [openTime, closeTime] = openClose;
    if (openTime === -1 || closeTime === -1) return -1000;

    let visitHour = Math.floor(currentTime / 60);
    if (visitHour < openTime) {
      currentTime = openTime * 60;
    }

    if (visitHour >= closeTime) return -800;
    if (Math.floor((currentTime + location.visit_duration) / 60) > closeTime) return -700;
    if (currentTime + location.visit_duration > startHour * 60 + totalMinutes) return -600;

    // ✅ Çoklu kategori kontrolü
    const locCats = Array.isArray(location.category) ? location.category : [location.category];
    const isPreferredCategory = locCats.some(cat => selectedCategories.includes(cat.toLowerCase()));

    let categoryBonus = 0;
    if (isPreferredCategory) {
      categoryBonus = 300;
    } else if (!location.must_visit) {
      categoryBonus = 100;
    } else {
      categoryBonus = -100;
    }

    const distancePenalty = previousLocationIndex === -1
      ? 0
      : distanceMatrix[previousLocationIndex][locationIndex] * 1.0;

    if (location.must_visit && location.distance_to_start <= MAX_DISTANCE_THRESHOLD) {
      const bonus = Math.max(0, 200 - location.distance_to_start * 10);
      niceToHaveBonus += bonus;
    }

    const locationScore = categoryBonus - distancePenalty;
    totalScore += locationScore;

    currentTime += location.visit_duration;
    previousLocationIndex = locationIndex;
  }

  const routeLengthBonus = route.length * 5;

  const fitness = (totalScore * 0.8) +
    niceToHaveBonus +
    (categoryRatio * 250) -
    (totalDistance * 0.2) +
    routeLengthBonus;

  return fitness;
}

module.exports = calculateFitness;
