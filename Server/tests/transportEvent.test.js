import { test } from 'node:test';
import assert from 'node:assert';
import { calculateHaversineDistance, checkGeofenceTrigger } from '../utils/geofenceHelper.js';
import { detectTripAnomalies } from '../utils/etaHelper.js';

test('calculateHaversineDistance computes distance correctly', () => {
  const nyc = { lat: 40.7128, lon: -74.0060 };
  const boston = { lat: 42.3601, lon: -71.0589 };

  const distanceMeters = calculateHaversineDistance(nyc, boston);

  assert(distanceMeters > 300000 && distanceMeters < 312000, `Expected distance ~306km, got: ${distanceMeters / 1000}km`);
});

test('checkGeofenceTrigger identifies coordinates within radius', () => {
  const school = { lat: 30.7333, lon: 76.7794 };
  const cabInside = { lat: 30.7340, lon: 76.7790 };
  const cabOutside = { lat: 30.7500, lon: 76.8000 };

  assert.strictEqual(checkGeofenceTrigger(cabInside, school, 300), true);
  assert.strictEqual(checkGeofenceTrigger(cabOutside, school, 300), false);
});

test('detectTripAnomalies computes ETA and flags traffic delay', () => {
  const route = {
    end_coords: { lat: 30.7333, lon: 76.7794 },
    duration_minutes: 20
  };

  const currentCoords = { lat: 30.7400, lon: 76.7850 };

  const resultNormal = detectTripAnomalies(route, currentCoords, 30);
  assert.strictEqual(resultNormal.isDelayed, false);
  assert(resultNormal.updatedEta > 0 && resultNormal.updatedEta < 10);

  const resultStuck = detectTripAnomalies(route, currentCoords, 1);
  assert.strictEqual(resultStuck.isDelayed, true);
  assert.strictEqual(resultStuck.delayReason, 'Heavy traffic / slow movement detected');
});
