import userModel from '../models/userModel.js';
import DriverProfile from '../models/DriverProfile.js';
import routeModel from '../models/routeModel.js';

export const isDriverProfileComplete = (profile) => {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.license_number &&
    profile.vehicle_number &&
    profile.profile_photo &&
    Number(profile.vehicle_seats || 0) > 0
  );
};

export const getEligibleDrivers = async ({ allowReassignment = false } = {}) => {
  const [drivers, profiles, activeRoutes] = await Promise.all([
    userModel.find({ role: 'driver', isAvailable: true }).select('name email phone_number profile_photo role isAvailable createdAt updatedAt'),
    DriverProfile.find({}),
    routeModel.find({ assignedBus: { $ne: null } }).select('driver assignedBus route_name start_location end_location')
  ]);

  const profileMap = new Map(profiles.map((profile) => [String(profile.user_id), profile]));
  const activeRouteMap = new Map();

  activeRoutes.forEach((route) => {
    if (route.driver) {
      activeRouteMap.set(String(route.driver), route);
    }
  });

  return drivers
    .map((driver) => {
      const profile = profileMap.get(String(driver._id)) || null;
      const activeRoute = activeRouteMap.get(String(driver._id)) || null;
      return {
        ...driver.toObject(),
        profile,
        hasCompletedProfile: isDriverProfileComplete(profile),
        activeRoute,
        eligible: Boolean(driver.isAvailable) && isDriverProfileComplete(profile) && (allowReassignment || !activeRoute)
      };
    })
    .filter((driver) => driver.hasCompletedProfile && driver.isAvailable && (allowReassignment || !driver.activeRoute));
};

export const getDriverAssignmentSummary = async (driverId) => {
  const [user, profile, activeRoute] = await Promise.all([
    userModel.findById(driverId).select('name email phone_number profile_photo role isAvailable createdAt updatedAt'),
    DriverProfile.findOne({ user_id: driverId }),
    routeModel.findOne({ driver: driverId, assignedBus: { $ne: null } })
  ]);

  if (!user) {
    return { ok: false, status: 404, message: 'Driver not found' };
  }

  if (user.role !== 'driver') {
    return { ok: false, status: 400, message: 'Selected user is not a driver' };
  }

  if (!user.isAvailable) {
    return { ok: false, status: 400, message: 'Driver is not active' };
  }

  if (!isDriverProfileComplete(profile)) {
    return { ok: false, status: 400, message: 'Driver profile is incomplete' };
  }

  return {
    ok: true,
    user,
    profile,
    activeRoute
  };
};

export const buildAssignmentNotification = ({ route, bus, fallbackTitle = 'Assignment updated' }) => {
  const routeName = route?.route_name || route?.start_location && route?.end_location
    ? `${route.start_location} to ${route.end_location}`
    : route?.start_location || 'Route';
  const busNumber = bus?.busNumber || bus?.vehicle_number || 'the assigned bus';

  return {
    title: fallbackTitle,
    message: `You have been assigned ${routeName} with Bus ${busNumber}.`,
    type: 'system',
    data: {
      routeId: route?._id ? String(route._id) : '',
      busId: bus?._id ? String(bus._id) : '',
      busNumber,
      routeName
    }
  };
};
