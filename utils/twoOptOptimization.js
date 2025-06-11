// utils/twoOptOptimization.js

function twoOptImprovement(route, locations, distanceMatrix) {
  console.log('🔄 2-opt optimizasyonu başlıyor...');
  
  let improved = true;
  let iterations = 0;
  let totalImprovement = 0;
  
  // İyileştirme olduğu sürece devam et
  while (improved) {
    improved = false;
    
    // Tüm olası kenar çiftlerini dene
    for (let i = 0; i < route.length - 2; i++) {
      for (let j = i + 2; j < route.length; j++) {
        // Mevcut mesafe
        const currentDistance = 
          getSegmentDistance(route, i, i + 1, distanceMatrix) +
          getSegmentDistance(route, j, (j + 1) % route.length, distanceMatrix);
        
        // 2-opt swap sonrası mesafe
        const newDistance = 
          getSegmentDistance(route, i, j, distanceMatrix) +
          getSegmentDistance(route, i + 1, (j + 1) % route.length, distanceMatrix);
        
        // Eğer yeni mesafe daha kısa ise
        if (newDistance < currentDistance) {
          // Segmenti ters çevir
          reverseRouteSegment(route, i + 1, j);
          
          improved = true;
          iterations++;
          totalImprovement += (currentDistance - newDistance);
          
          console.log(`✅ İyileştirme ${iterations}: ${(currentDistance - newDistance).toFixed(2)} km kazanç`);
        }
      }
    }
  }
  
  console.log(`🏁 2-opt tamamlandı: ${iterations} iyileştirme, toplam ${totalImprovement.toFixed(2)} km kazanç`);
  return route;
}

// Yardımcı fonksiyonlar
function getSegmentDistance(route, from, to, distanceMatrix) {
  const fromIdx = route[from];
  const toIdx = route[to % route.length];
  return distanceMatrix[fromIdx][toIdx];
}

function reverseRouteSegment(route, start, end) {
  while (start < end) {
    // Swap
    [route[start], route[end]] = [route[end], route[start]];
    start++;
    end--;
  }
}

// Toplam rota mesafesini hesapla
function calculateTotalDistance(route, distanceMatrix) {
  let total = 0;
  for (let i = 0; i < route.length; i++) {
    const from = route[i];
    const to = route[(i + 1) % route.length];
    total += distanceMatrix[from][to];
  }
  return total;
}

module.exports = { twoOptImprovement, calculateTotalDistance };