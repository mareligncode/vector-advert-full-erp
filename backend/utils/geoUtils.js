/**
 * Calculates the great-circle distance between two points on Earth
 * using the Haversine formula (returns distance in meters).
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }

  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Finds the closest office location from an array of office references.
 */
export const findNearestOffice = (userLat, userLong, offices = []) => {
  if (!offices || offices.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const office of offices) {
    if (office.location && typeof office.location.lat === 'number' && typeof office.location.long === 'number') {
      const distance = calculateDistanceMeters(
        userLat,
        userLong,
        office.location.lat,
        office.location.long
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          office,
          distanceMeters: distance
        };
      }
    }
  }

  return nearest;
};

/**
 * Checks whether user coordinates fall within any configured office's allowed radius.
 */
export const checkOfficeProximity = (userLat, userLong, offices = [], defaultMaxDistance = 200) => {
  const nearest = findNearestOffice(userLat, userLong, offices);
  if (!nearest) {
    return {
      isAllowed: true, // If no offices defined, don't block
      nearestOffice: null,
      distanceMeters: null
    };
  }

  const allowedRadius = nearest.office.radiusMeters || defaultMaxDistance;
  const isAllowed = nearest.distanceMeters <= allowedRadius;

  return {
    isAllowed,
    nearestOffice: nearest.office,
    distanceMeters: nearest.distanceMeters,
    allowedRadius
  };
};
