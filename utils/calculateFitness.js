const { TRAVEL_TIME_PER_KM } = require('../utils/constants');

function calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategory) {
  if (!route || route.length === 0) return -1000;

  let totalDistance = 0;
  let totalScore = 0;
  let currentTime = startHour * 60;
  const totalMinutes = totalHours * 60;
  let previousIdx = -1;

  const mustVisit = locations.map((l, i) => l.mustVisit ? i : null).filter(i => i !== null);
  const categoryMatched = locations.map((l, i) => l.category === selectedCategory ? i : null).filter(i => i !== null);

  const mustVisitInRoute = mustVisit.filter(i => route.includes(i)).length;
  const categoryInRoute = categoryMatched.filter(i => route.includes(i)).length;

  const mustVisitRatio = mustVisit.length ? mustVisitInRoute / mustVisit.length : 1.0;
  const categoryRatio = categoryMatched.length ? categoryInRoute / categoryMatched.length : 1.0;

  if (mustVisit.length && mustVisitInRoute < mustVisit.length) {
    return -800 - (mustVisit.length - mustVisitInRoute) * 200;
  }

  for (let idx of route) {
    const loc = locations[idx];

    if (previousIdx !== -1) {
      const dist = distanceMatrix[previousIdx][idx];
      const travelTime = dist * TRAVEL_TIME_PER_KM;
      currentTime += travelTime;
      totalDistance += dist;
    }

    const [open, close] = loc.openingHours[day];
    if (open === -1 || close === -1) return -1000;

    const hour = Math.floor(currentTime / 60);
    if (hour < open) currentTime = open * 60;
    if (hour >= close) return -800;
    if ((currentTime + loc.visitDuration) / 60 > close) return -700;
    if (currentTime + loc.visitDuration > startHour * 60 + totalMinutes) return -600;

    const mustBonus = loc.mustVisit ? 100 : 0;
    const catBonus = loc.category === selectedCategory ? 150 : -30;
    const distPenalty = previousIdx === -1 ? 0 : distanceMatrix[previousIdx][idx];

    totalScore += mustBonus + catBonus - distPenalty;
    currentTime += loc.visitDuration;
    previousIdx = idx;
  }

  const routeBonus = route.length * 5;
  return (totalScore * 0.8) + (mustVisitRatio * 200) + (categoryRatio * 250) - (totalDistance * 0.2) + routeBonus;
}

module.exports = { calculateFitness };
