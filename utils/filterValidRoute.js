const { TRAVEL_TIME_PER_KM } = require('../utils/constants');

function checkLocationValidity(idx, location, previousIdx, currentTime, endTime, distanceMatrix, day) {
  let travelTime = 0;
  let tempTime = currentTime;

  if (previousIdx !== -1) {
    const distance = distanceMatrix[previousIdx][idx];
    travelTime = Math.min(distance * TRAVEL_TIME_PER_KM, 120); // max 2 saat
    tempTime += travelTime;
  }

  const [open, close] = location.openingHours[day];
  if (open === -1 || close === -1) return [false, 0, 0];

  if (Math.floor(tempTime / 60) < open) tempTime = open * 60;
  if (Math.floor(tempTime / 60) >= close) return [false, 0, 0];
  if (Math.floor((tempTime + location.visitDuration) / 60) > close) return [false, 0, 0];
  if (tempTime + location.visitDuration > endTime) return [false, 0, 0];

  const distanceScore = -travelTime;
  const categoryScore = location.categoryMatch ? 100 : 0;
  const totalScore = categoryScore + distanceScore;

  return [true, tempTime, totalScore];
}

function filterValidRoute(route, locations, distanceMatrix, day, startHour, totalHours) {
  if (!route || route.length === 0) return [[], {}];

  const validRoute = [];
  const visitTimes = {};
  const totalMinutes = totalHours * 60;
  const endTime = startHour * 60 + totalMinutes;

  let currentTime = startHour * 60;
  let previousIdx = -1;
  let remaining = new Set(route);
  const mustVisits = route.filter(i => locations[i].mustVisit);

  const addBestNext = (candidates) => {
    let bestIdx = null;
    let bestScore = -Infinity;
    let bestTime = 0;

    for (const idx of candidates) {
      const [isValid, tempTime, score] = checkLocationValidity(
        idx, locations[idx], previousIdx, currentTime, endTime, distanceMatrix, day
      );
      if (isValid && score > bestScore) {
        bestScore = score;
        bestIdx = idx;
        bestTime = tempTime;
      }
    }

    if (bestIdx !== null) {
      validRoute.push(bestIdx);
      visitTimes[bestIdx] = bestTime;
      currentTime = bestTime + locations[bestIdx].visitDuration;
      remaining.delete(bestIdx);
      return bestIdx;
    }

    return null;
  };

  while (mustVisits.length > 0 && currentTime < endTime) {
    const added = addBestNext(mustVisits);
    if (added === null) break;
    mustVisits.splice(mustVisits.indexOf(added), 1);
    previousIdx = added;
  }

  const others = Array.from(remaining);

  while (others.length > 0 && currentTime < endTime) {
    const added = addBestNext(others);
    if (added === null) break;
    others.splice(others.indexOf(added), 1);
    previousIdx = added;
  }

  return [validRoute, visitTimes];
}

module.exports = { filterValidRoute };
