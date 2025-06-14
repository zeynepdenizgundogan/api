function optimizeRouteOrder(route, locations, distanceMatrix) {
  if (!route.length) return [];
  const remaining = new Set(route);
  const start = [...remaining].reduce((minIdx, idx) =>
    locations[idx].distance_to_start < locations[minIdx].distance_to_start ? idx : minIdx
  );
  const ordered = [start];
  remaining.delete(start);

  while (remaining.size) {
    const last = ordered[ordered.length - 1];
    const next = [...remaining].reduce((minIdx, idx) =>
      distanceMatrix[last][idx] < distanceMatrix[last][minIdx] ? idx : minIdx
    );
    ordered.push(next);
    remaining.delete(next);
  }

  return ordered;
}
module.exports = optimizeRouteOrder;
