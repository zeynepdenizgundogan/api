function optimizeRouteOrder(route, locations, distanceMatrix) {
  if (!route || route.length === 0) return [];

  const optimizedRoute = [];
  const remaining = new Set(route);

  // Başlangıç noktasına en yakın lokasyon ile başla
  let currentLoc = [...remaining].reduce((a, b) => {
    return locations[a].distance_to_start < locations[b].distance_to_start ? a : b;
  });

  optimizedRoute.push(currentLoc);
  remaining.delete(currentLoc);

  // Her adımda en yakın lokasyonu seç
  while (remaining.size > 0) {
    const nextLoc = [...remaining].reduce((a, b) => {
      return distanceMatrix[currentLoc][a] < distanceMatrix[currentLoc][b] ? a : b;
    });

    optimizedRoute.push(nextLoc);
    remaining.delete(nextLoc);
    currentLoc = nextLoc;
  }

  return optimizedRoute;
}

module.exports = optimizeRouteOrder;
