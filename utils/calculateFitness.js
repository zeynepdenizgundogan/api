const { MAX_DISTANCE_THRESHOLD, TRAVEL_TIME_PER_KM } = require("./constants");

function calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories, niceToHaveIds = new Set()) {
  if (!route || route.length === 0) return -1000;
  if (route.length === 1) return 10;

  let totalDistance = 0;
  let totalScore = 0;
  let currentTime = startHour * 60;
  const totalMinutes = totalHours * 60;
  let previousIdx = -1;

  // 🔥 PYTHON UYUMLU: Category ratio calculation
  const categoryLocations = [];
  for (let i = 0; i < locations.length; i++) {
    const locationCategory = locations[i].category.toLowerCase();
    const isInSelectedCategories = selectedCategories.some(cat => 
      cat.toLowerCase() === locationCategory
    );
    if (isInSelectedCategories) {
      categoryLocations.push(i);
    }
  }

  const categoryInRoute = route.filter(idx => categoryLocations.includes(idx)).length;
  const categoryRatio = categoryLocations.length > 0 ? categoryInRoute / categoryLocations.length : 1.0;

  let niceToHaveBonus = 0;
  let timeEfficiency = 0;

  for (let i = 0; i < route.length; i++) {
    const locationIndex = route[i];
    const location = locations[locationIndex];

    // Travel time calculation
    if (previousIdx !== -1) {
      const travelDistance = distanceMatrix[previousIdx][locationIndex];
      const travelTime = travelDistance * TRAVEL_TIME_PER_KM;
      currentTime += travelTime;
      totalDistance += travelDistance;
    }

    // Opening hours check
    const openClose = location.opening_hours[day];
    if (!openClose) return -1000;
    const [openTime, closeTime] = openClose;
    if (openTime === -1 || closeTime === -1) return -1000;

    // 🔥 PYTHON UYUMLU: Visit hour calculation (normal division)
    const visitHour = currentTime / 60;
    
    // Waiting time penalty
    if (visitHour < openTime) {
      const waitMinutes = (openTime * 60) - currentTime;
      currentTime = openTime * 60;
      totalScore -= waitMinutes * 0.3; // Her bekleme dakikasına 0.3 ceza
    }

    // Time constraints check
    if (visitHour >= closeTime) return -800;
    if (Math.floor((currentTime + location.visit_duration) / 60) > closeTime) return -700;
    if (currentTime + location.visit_duration > startHour * 60 + totalMinutes) return -600;

    // 🔥 PYTHON UYUMLU: Category bonus calculation
    const locationCategory = location.category.toLowerCase();
    const isInSelectedCategories = selectedCategories.some(cat => 
      cat.toLowerCase() === locationCategory
    );
    
    let categoryBonus;
    if (isInSelectedCategories) {
      categoryBonus = 150; // Python'daki gibi
    } else if (!location.must_visit) { // Python'da bu kontrol var
      categoryBonus = 100;
    } else {
      categoryBonus = 0;
    }

    // Distance penalty
    const distancePenalty = previousIdx === -1 ? 0 : distanceMatrix[previousIdx][locationIndex] * 1.0;

    // 🔥 PYTHON UYUMLU: Must visit bonus
    if (niceToHaveIds.has(location.id) && location.distance_to_start <= MAX_DISTANCE_THRESHOLD) {
      const distance = location.distance_to_start;
      const bonus = Math.max(0, 300 - distance * 10);
      niceToHaveBonus += bonus;
    }

    const locationScore = categoryBonus - distancePenalty;
    totalScore += locationScore;

    currentTime += location.visit_duration;
    previousIdx = locationIndex;
  }

  // Final calculations
  const routeLengthBonus = route.length * 5;
  timeEfficiency = currentTime <= totalHours * 60 ? 
    (totalHours * 60 - currentTime) / (totalHours * 60) * 100 : 0;

  // 🔥 PYTHON UYUMLU: Final fitness calculation
  const fitness = (
    (totalScore * 0.8) +
    niceToHaveBonus +
    (categoryRatio * 300) -
    (totalDistance * 0.5) +
    routeLengthBonus +
    timeEfficiency
  );

  return fitness;
}

module.exports = calculateFitness;