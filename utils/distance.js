function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(val => val === undefined || val === null)) {
    console.warn('Eksik koordinatlar:', { lat1, lon1, lat2, lon2 });
    return null;
  }

  const R = 6371; // km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


module.exports = calculateDistance;
