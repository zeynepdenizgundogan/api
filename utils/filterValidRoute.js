const { TRAVEL_TIME_PER_KM } = require("./constants");

function checkLocationValidity(idx, location, previousIndex, currentTime, endTime, distanceMatrix, day, selectedCategories) {
  let travelTime = 0;
  let tempTime = currentTime;

  if (previousIndex !== -1) {
    const travelDistance = distanceMatrix[previousIndex][idx];
    travelTime = Math.min(travelDistance * TRAVEL_TIME_PER_KM, 120);
    tempTime += travelTime;
  }

  const [openTime, closeTime] = location.opening_hours?.[day] || [-1, -1];
  if (openTime === -1 || closeTime === -1) {
    return [false, 0, 0];
  }

  const visitHour = Math.floor(tempTime / 60);
  if (visitHour < openTime) {
    tempTime = openTime * 60;
  }

  if (visitHour >= closeTime) return [false, 0, 0];
  if (Math.floor((tempTime + location.visit_duration) / 60) > closeTime) return [false, 0, 0];
  if ((tempTime + location.visit_duration) > endTime) return [false, 0, 0];

  const locCategories = Array.isArray(location.category) ? location.category : [location.category];
  const match = locCategories.some(cat =>
    selectedCategories.includes(cat.toLowerCase())
  );
  const categoryScore = match ? 100 : 0;
  const distanceScore = -travelTime;
  const totalScore = categoryScore + distanceScore;

  return [true, tempTime, totalScore];
}

module.exports = checkLocationValidity;
