const EARTH_RADIUS_METERS = 6371000;

export const calculateHaversineDistance = (pointA, pointB) => {
  if (!pointA || !pointB) {
    return 0;
  }

  const lat1 = Number(pointA.lat);
  const lon1 = Number(pointA.lon);
  const lat2 = Number(pointB.lat);
  const lon2 = Number(pointB.lon);

  if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(value))) {
    return 0;
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

export const checkGeofenceTrigger = (currentCoords, targetCoords, radiusMeters = 300) => {
  if (!currentCoords || !targetCoords) {
    return false;
  }

  const distance = calculateHaversineDistance(currentCoords, targetCoords);
  return distance <= radiusMeters;
};
