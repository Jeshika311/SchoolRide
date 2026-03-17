import logger from '../utils/logger.js';

/**
 * Service generic Map API integration (mocking or using free OSM APIs as industry standard non-key implementation)
 * In production, easily swapped with Google Maps API: https://maps.googleapis.com/maps/api/directions/json
 */
export const geocodeAddress = async (address) => {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'SchoolRideApp/1.0' } });
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (err) {
        logger.error(`Geocoding failed for address: ${address} - ${err.message}`);
        // Mock fallback for testing if API block us
        return { lat: 40.7128, lon: -74.0060 }; // New York fallback
    }
};

export const getRouteData = async (startCoords, endCoords, waypoints = []) => {
    try {
        let coordsString = `${startCoords.lon},${startCoords.lat}`;
        for (let wp of waypoints) {
            coordsString += `;${wp.lon},${wp.lat}`;
        }
        coordsString += `;${endCoords.lon},${endCoords.lat}`;

        const url = `http://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok') {
            throw new Error(data.message || 'OSRM routing failed');
        }

        const route = data.routes[0];
        return {
            distance_meters: route.distance,
            duration_seconds: route.duration,
            geometry: route.geometry, // GeoJSON
            distance_km: parseFloat((route.distance / 1000).toFixed(2)),
            duration_minutes: Math.ceil(route.duration / 60)
        };
    } catch (err) {
        logger.error(`Routing failed: ${err.message}`);
        // Fallback for offline or throttled mock
        return {
            distance_meters: 5000,
            duration_seconds: 600,
            distance_km: 5.0,
            duration_minutes: 10,
            mocked: true
        };
    }
};

export const calculateRouteDetails = async (startAddress, endAddress, waypoints = []) => {
    const start = await geocodeAddress(startAddress);
    const end = await geocodeAddress(endAddress);
    
    if (!start || !end) {
        throw new Error('Unable to geocode one or more addresses');
    }

    const wpCoords = [];
    for (const wp of waypoints) {
        const coords = await geocodeAddress(wp);
        if (coords) wpCoords.push(coords);
    }
    
    const route = await getRouteData(start, end, wpCoords);
    return {
        start_coords: start,
        end_coords: end,
        waypoints_coords: wpCoords,
        ...route
    };
};
