const { TRAVEL_TIME_PER_KM, MAX_DISTANCE_THRESHOLD } = require("./constants");
const { DEFAULT_START_HOUR, DEFAULT_TOTAL_HOURS } = require("../utils/constants");

function calculateFitness(route, locations, distanceMatrix, day, startHour = DEFAULT_START_HOUR, totalHours = DEFAULT_TOTAL_HOURS, selectedCategories) {
  if (!route || route.length === 0) return -1000;
  if (route.length === 1) return 50; // Tek lokasyon için daha yüksek puan

  let totalDistance = 0;
  let totalScore = 0;
  let currentTime = startHour * 60;
  const totalMinutes = totalHours * 60;
  let previousLocationIndex = -1;
  let visitedLocations = 0;
  let timeViolations = 0;

  // Kategori ve kalite analizleri
  const selectedCatsLower = selectedCategories.map(cat => cat.toLowerCase());
  let categoryMatchCount = 0;
  let mustVisitCount = 0;
  let totalWaitTime = 0;

  // Lokasyon sayısı bonusu - en az 4 lokasyon teşviki
  const routeLengthBonus = route.length >= 4 ? route.length * 40 : route.length * 20;

  for (let i = 0; i < route.length; i++) {
    const locationIndex = route[i];
    const location = locations[locationIndex];

    if (!location) continue;

    // Seyahat süresi hesaplama
    if (previousLocationIndex !== -1) {
      const travelDistance = distanceMatrix[previousLocationIndex][locationIndex];
      if (travelDistance === undefined || travelDistance < 0) continue;
      
      const travelTime = travelDistance * TRAVEL_TIME_PER_KM;
      currentTime += travelTime;
      totalDistance += travelDistance;
    }

    // Açılış saatleri kontrolü
    const openClose = location.opening_hours?.[day];
    if (!openClose) {
      timeViolations++;
      continue;
    }

    const [openTime, closeTime] = openClose;
    if (openTime === -1 || closeTime === -1) {
      timeViolations++;
      continue;
    }

    // Zaman kontrolü
    const visitHour = currentTime / 60;
    
    if (visitHour < openTime) {
      const waitTime = (openTime * 60) - currentTime;
      totalWaitTime += waitTime;
      currentTime = openTime * 60;
      totalScore -= waitTime * 0.2; // Bekleme cezası azaltıldı
    }

    if (visitHour >= closeTime) {
      timeViolations++;
      continue;
    }
    
    if (Math.floor((currentTime + location.visit_duration) / 60) > closeTime) {
      timeViolations++;
      continue;
    }
    
    if (currentTime + location.visit_duration > startHour * 60 + totalMinutes) {
      timeViolations++;
      continue;
    }

    // Bu lokasyon geçerli, puanlama yap
    visitedLocations++;

    // Kategori eşleşme bonusu
    const locCategories = Array.isArray(location.category) ? 
      location.category.map(cat => cat.toLowerCase()) : 
      [location.category.toLowerCase()];
    
    const hasMatchingCategory = locCategories.some(cat => selectedCatsLower.includes(cat));
    if (hasMatchingCategory) {
      categoryMatchCount++;
      totalScore += 200; // Kategori eşleşme bonusu
    } else {
      totalScore += 80; // Genel ziyaret bonusu
    }

    // Must-visit bonusu
    if (location.must_visit) {
      mustVisitCount++;
      if (location.distance_to_start <= MAX_DISTANCE_THRESHOLD) {
        const distanceBonus = Math.max(100, 250 - (location.distance_to_start * 8));
        totalScore += distanceBonus;
      } else {
        totalScore += 150; // Uzak must-visit için de bonus
      }
    }

    // Mesafe cezası (daha yumuşak)
    if (previousLocationIndex !== -1) {
      const distance = distanceMatrix[previousLocationIndex][locationIndex];
      const distancePenalty = Math.min(50, distance * 1.5); // Ceza azaltıldı
      totalScore -= distancePenalty;
    }

    currentTime += location.visit_duration;
    previousLocationIndex = locationIndex;
  }

  // Bonus hesaplamaları
  
  // 1. Minimum lokasyon bonusu
  const minLocationBonus = visitedLocations >= 4 ? 300 : (visitedLocations >= 3 ? 150 : 0);
  
  // 2. Kategori çeşitlilik bonusu
  const categoryRatio = route.length > 0 ? categoryMatchCount / route.length : 0;
  const categoryBonus = categoryRatio * 250;
  
  // 3. Must-visit bonusu
  const mustVisitBonus = mustVisitCount * 120;
  
  // 5. Zaman kullanım bonusu
  const timeUsed = currentTime - (startHour * 60);
  const timeUsageRatio = Math.min(1.0, timeUsed / (totalHours * 60));
  const timeUsageBonus = timeUsageRatio * 150;

  // 6. Çeşitlilik bonusu (farklı kategorilerden lokasyonlar)
  const uniqueCategories = new Set();
  route.forEach(idx => {
    const loc = locations[idx];
    if (loc && loc.category) {
      const cats = Array.isArray(loc.category) ? loc.category : [loc.category];
      cats.forEach(cat => uniqueCategories.add(cat.toLowerCase()));
    }
  });
  const diversityBonus = uniqueCategories.size * 60;

  // Ceza hesaplamaları
  const timeViolationPenalty = timeViolations * 150; // Ceza azaltıldı
  const waitTimePenalty = totalWaitTime * 0.3;
  const totalDistancePenalty = totalDistance * 0.8;

  // Final fitness hesaplama
  const fitness = totalScore 
    + routeLengthBonus 
    + minLocationBonus
    + categoryBonus 
    + mustVisitBonus 
    + timeUsageBonus
    + diversityBonus
    - timeViolationPenalty 
    - waitTimePenalty 
    - totalDistancePenalty;

  // Debug için (isteğe bağlı)
  if (process.env.DEBUG_FITNESS === 'true') {
    console.log(`
      Route: ${route.length} locations, Visited: ${visitedLocations}
      Category matches: ${categoryMatchCount}/${route.length} (${(categoryRatio*100).toFixed(1)}%)
      Must-visit: ${mustVisitCount}
      Time violations: ${timeViolations}
      Final fitness: ${fitness.toFixed(2)}
    `);
  }

  return fitness;
}

module.exports = calculateFitness;