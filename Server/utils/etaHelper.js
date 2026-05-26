import { calculateHaversineDistance } from './geofenceHelper.js';

export const detectTripAnomalies = (route, currentCoords, currentSpeed = 0) => {
  if (!route || !route.end_coords || !currentCoords) {
    return {
      isDelayed: false,
      updatedEta: 0,
      delayReason: ''
    };
  }

  const distanceRemainingMeters = calculateHaversineDistance(currentCoords, {
    lat: route.end_coords.lat,
    lon: route.end_coords.lon
  });

  const distanceRemainingKm = distanceRemainingMeters / 1000;
  const speedKmH = currentSpeed > 0 ? currentSpeed : 30;
  const updatedEta = Math.max(1, Math.round((distanceRemainingKm / speedKmH) * 60));
  const plannedEta = route.duration_minutes || updatedEta;
  const isDelayed = speedKmH < 5 || updatedEta > plannedEta * 1.5;

  return {
    isDelayed,
    updatedEta,
    delayReason: speedKmH < 5 ? 'Heavy traffic / slow movement detected' : (isDelayed ? 'ETA is higher than planned route timing' : '')
  };
};
