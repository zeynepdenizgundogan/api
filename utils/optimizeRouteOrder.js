function optimizeRouteOrder(route, locations, distanceMatrix) {
    if (!route || route.length === 0) return [];
  
    const mustVisit = route.filter(idx => locations[idx].mustVisit);
    const first =
      mustVisit.length > 0
        ? mustVisit.reduce((a, b) =>
            locations[a].distanceToStart < locations[b].distanceToStart ? a : b
          )
        : route.reduce((a, b) =>
            locations[a].distanceToStart < locations[b].distanceToStart ? a : b
          );
  
    const optimized = [first];
    const remaining = route.filter(i => i !== first);
  
    const mustVisitRemaining = remaining.filter(i => locations[i].mustVisit);
    const others = remaining.filter(i => !locations[i].mustVisit);
  
    while (mustVisitRemaining.length > 0) {
      const last = optimized[optimized.length - 1];
      const next = mustVisitRemaining.reduce((a, b) =>
        distanceMatrix[last][a] < distanceMatrix[last][b] ? a : b
      );
      optimized.push(next);
      mustVisitRemaining.splice(mustVisitRemaining.indexOf(next), 1);
    }
  
    while (others.length > 0) {
      const last = optimized[optimized.length - 1];
      const next = others.reduce((a, b) =>
        distanceMatrix[last][a] < distanceMatrix[last][b] ? a : b
      );
      optimized.push(next);
      others.splice(others.indexOf(next), 1);
    }
  
    return optimized;
  }
  
  module.exports = { optimizeRouteOrder };
  