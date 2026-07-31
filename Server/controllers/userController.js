import userModel from "../models/userModel.js";
import DriverProfile from "../models/DriverProfile.js";
import parentProfile from "../models/parentProfile.js";
import bookingModel from "../models/bookingModel.js";
import bookingNewModel from "../models/bookingNewModel.js";
import busModel from "../models/busModel.js";
import routeModel from "../models/routeModel.js";
import paymentModel from "../models/paymentModel.js";
import notificationModel from "../models/notificationModel.js";
import SupportTicket from "../models/supportTicket.js";
import { getEligibleDrivers } from '../utils/assignmentHelpers.js';
import { emitToRole } from '../sockets/socketManager.js';

const mapBookingModel = (booking) => ({
  id: booking._id,
  status: booking.status,
  bookingStatus: booking.bookingStatus,
  tripStatus: booking.trip_status,
  childName: booking.child_name,
  pickupPoint: booking.pickup_point,
  dropPoint: booking.drop_point,
  pickupStop: booking.pickupStop,
  dropStop: booking.dropStop,
  seatNumber: booking.seatNumber,
  bus: booking.busId || booking.vehicle || null,
  route: booking.route_id || null,
  driver: booking.driver_id || null,
  parent: booking.parent_id || null,
  student: booking.studentId || null,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt
});

const isBusActive = (bus) => {
  const lat = bus?.currentLocation?.lat ?? 0;
  const lng = bus?.currentLocation?.lng ?? 0;
  return lat !== 0 || lng !== 0;
};

const startOfDay = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if(!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
  
    const user = await userModel.findById(userId).select("-password");

    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    let roleProfile = null;

    if(user.role === 'driver') {
      roleProfile = await DriverProfile.findOne({user_id: userId});
    } 
    else if(user.role === 'parent') {
      roleProfile = await parentProfile.findOne({user_id: userId});
    }

    return res.status(200).json({
      success: true,
      user,
      roleProfile
    })
  }
  catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

export const updateProfile = async (req,res) => {
  try {
    const userId = req.user?.id;

    if(!userId){
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }

    const {name, email, preferred_language, profile_photo, phone_number} = req.body;

    const updateData = {};

    if(name) updateData.name = name;
    if(email){
      const normalizedEmail = String(email).toLowerCase().trim();

      if(!/\S+@\S+\.\S+/.test(normalizedEmail)){
        return res.status(400).json({
          success: false,
          message: "Please use a valid email address"
        });
      }

      const existingUser = await userModel.findOne({ email: normalizedEmail, _id: { $ne: userId } });
      if(existingUser){
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }

      updateData.email = normalizedEmail;
    }
    if(preferred_language) updateData.preferred_language = preferred_language;
    if(profile_photo) updateData.profile_photo = profile_photo;
    if(phone_number !== undefined){
      const normalizedPhone = String(phone_number).trim();

      if(!/^\d{10}$/.test(normalizedPhone)){
        return res.status(400).json({
          success: false,
          message: "Phone number must be a valid 10-digit number"
        });
      }

      updateData.phone_number = normalizedPhone;
    }

    if(Object.keys(updateData).length === 0){
      return res.status(400).json({
        success: false,
        message: "No data provided to update"
      })
    }

    const user = await userModel.findByIdAndUpdate(userId, updateData,{ new: true}).select("-password");

    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  }
  catch(error) {
    if(error?.code === 11000 && error?.keyPattern?.phone_number){
      return res.status(400).json({
        success: false,
        message: "Phone number already in use"
      });
    }

    console.log("Update Profile Error: ", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

export const getParentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'parent') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const profile = await parentProfile.findOne({ user_id: userId });
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Get Parent Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateParentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'parent') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const {
      child_name,
      school_name,
      grade_class,
      pickup_address,
      drop_address
    } = req.body;
    const updateData = {};
    if (child_name !== undefined) updateData.child_name = child_name;
    if (school_name !== undefined) updateData.school_name = school_name;
    if (grade_class !== undefined) updateData.grade_class = grade_class;
    if (pickup_address !== undefined) updateData.pickup_address = pickup_address;
    if (drop_address !== undefined) updateData.drop_address = drop_address;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No data provided to update" });
    }
    const profile = await parentProfile.findOneAndUpdate({ user_id: userId }, updateData, { new: true, upsert: true });
    return res.json({ success: true, message: "Parent profile updated", profile });
  } catch (error) {
    console.error("Update Parent Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const profile = await DriverProfile.findOne({ user_id: userId });
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Get Driver Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const {
      vehicle_number,
      vehicle_type,
      license_number,
      years_experience,
      vehicle_seats,
      profile_photo,
    } = req.body;
    const updateData = {};
    if (vehicle_number !== undefined) updateData.vehicle_number = vehicle_number;
    if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
    if (license_number !== undefined) updateData.license_number = license_number;
    if (years_experience !== undefined && years_experience !== '') updateData.years_experience = Number(years_experience);
    if (vehicle_seats !== undefined && vehicle_seats !== '') updateData.vehicle_seats = Number(vehicle_seats);
    if (profile_photo !== undefined) updateData.profile_photo = profile_photo;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No data provided to update" });
    }
    const profile = await DriverProfile.findOneAndUpdate({ user_id: userId }, updateData, { new: true, upsert: true });
    return res.json({ success: true, message: "Driver profile updated", profile });
  } catch (error) {
    console.error("Update Driver Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateDriverAvailability = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userModel.findById(userId);
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { isAvailable } = req.body;
    if (isAvailable === undefined) {
      return res.status(400).json({ success: false, message: "Availability value is required" });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { isAvailable: Boolean(isAvailable) },
      { new: true }
    ).select("-password");

    ['admin', 'driver'].forEach((role) => {
      emitToRole(role, 'dashboard_updated', { entity: 'driver', id: updatedUser._id, action: 'availability' });
    });

    return res.status(200).json({
      success: true,
      message: `Driver is now ${updatedUser.isAvailable ? 'online' : 'offline'}`,
      user: updatedUser
    });
  } catch (error) {
    console.error("Update Driver Availability Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userModel.findById(userId).select("-password");
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const startOfToday = startOfDay();
    const [profile, bus, route, bookings, notifications, unreadCount] = await Promise.all([
      DriverProfile.findOne({ user_id: userId }),
      busModel.findOne({ driver: userId }).populate('route').populate('driver'),
      routeModel.findOne({ driver: userId }).populate('assignedBus').populate('driver'),
      bookingModel.find({ driver_id: userId })
        .populate('parent_id', 'name email phone_number profile_photo')
        .populate('route_id')
        .populate('trip_id')
        .populate('vehicle')
        .sort({ createdAt: -1 }),
      notificationModel.find({ user: userId }).sort({ createdAt: -1 }).limit(8),
      notificationModel.countDocuments({ user: userId, read: false })
    ]);

    const activeBookings = bookings.filter((booking) => booking.status === 'accepted' && booking.trip_status !== 'dropped');
    const upcomingBookings = bookings.filter((booking) => booking.status === 'pending');
    const bookingHistory = bookings.filter((booking) => ['completed', 'rejected'].includes(booking.status));
    const todayTrips = bus
      ? await bookingNewModel.countDocuments({
          busId: bus._id,
          bookingStatus: 'Confirmed',
          createdAt: { $gte: startOfToday }
        }).catch(() => 0)
      : 0;
    const studentCount = bus
      ? await bookingNewModel.countDocuments({ busId: bus._id, bookingStatus: 'Confirmed' }).catch(() => 0)
      : 0;
    const pickupStops = route?.stops || bus?.pickupStops || [];
    const currentStatus = bus?.status || (user.isAvailable ? 'active' : 'inactive');

    const simplifiedBookings = (items) => items.map((booking) => ({
      id: booking._id,
      parentName: booking.parent_id?.name || 'Passenger',
      parentPhone: booking.parent_id?.phone_number || booking.parent_id?.phone || '',
      parentEmail: booking.parent_id?.email || '',
      childName: booking.child_name,
      pickupPoint: booking.pickup_point,
      dropPoint: booking.drop_point,
      route: booking.route_id,
      trip: booking.trip_id,
      vehicle: booking.vehicle,
      status: booking.status,
      tripStatus: booking.trip_status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        assignedBus: bus,
        assignedRoute: route,
        currentStatus,
        pickupStops,
        todayTrips,
        studentCount,
        liveLocation: bus?.currentLocation || null,
        availability: Boolean(user.isAvailable),
        stats: {
          totalBookings: bookings.length,
          activeBookings: activeBookings.length,
          upcomingBookings: upcomingBookings.length,
          historyBookings: bookingHistory.length,
          unreadNotifications: unreadCount,
          estimatedEarnings: bookingHistory.length * 250,
          pendingPayout: activeBookings.length * 120
        },
        activeBookings: simplifiedBookings(activeBookings),
        upcomingBookings: simplifiedBookings(upcomingBookings),
        bookingHistory: simplifiedBookings(bookingHistory),
        notifications,
        recentBooking: bookings[0] ? simplifiedBookings([bookings[0]])[0] : null
      }
    });
  } catch (error) {
    console.error("Get Driver Dashboard Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await userModel.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [roleProfile, notifications] = await Promise.all([
      user.role === 'driver'
        ? DriverProfile.findOne({ user_id: userId })
        : user.role === 'parent'
          ? parentProfile.findOne({ user_id: userId })
          : Promise.resolve(null),
      notificationModel.find({ user: userId }).sort({ createdAt: -1 }).limit(8)
    ]);

    if (user.role === 'admin') {
      const today = startOfDay();
      const [
        totalDrivers,
        totalParents,
        totalBuses,
        totalRoutes,
        activeDrivers,
        buses,
        routes,
        modernBookings,
        legacyBookings,
        revenueSummary,
        recentBookings,
        recentPayments
      ] = await Promise.all([
        userModel.countDocuments({ role: 'driver' }),
        userModel.countDocuments({ role: 'parent' }),
        busModel.countDocuments({}),
        routeModel.countDocuments({}),
        userModel.countDocuments({ role: 'driver', isAvailable: true }),
        busModel.find({}).sort({ createdAt: -1 }).limit(12),
        routeModel.find({}).populate('driver', 'name email role profile_photo isAvailable').sort({ createdAt: -1 }).limit(12),
        bookingNewModel.find({}).populate('studentId', 'name email profile_photo').populate('busId').sort({ createdAt: -1 }).limit(12),
        bookingModel.find({}).populate('parent_id', 'name email profile_photo').populate('driver_id', 'name email profile_photo').populate('route_id').populate('trip_id').populate('vehicle').sort({ createdAt: -1 }).limit(12),
        paymentModel.aggregate([
          { $match: { paymentStatus: 'Paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        bookingNewModel.find({}).populate('studentId', 'name email profile_photo').populate('busId').sort({ createdAt: -1 }).limit(5),
        paymentModel.find({}).populate('studentId', 'name email profile_photo').sort({ createdAt: -1 }).limit(5)
      ]);

      const totalBookings = modernBookings.length + legacyBookings.length;
      const pendingBookings = modernBookings.filter((booking) => ['Pending', 'Payment Pending'].includes(booking.bookingStatus)).length
        + legacyBookings.filter((booking) => booking.status === 'pending').length;
      const completedBookings = modernBookings.filter((booking) => booking.bookingStatus === 'Confirmed').length
        + legacyBookings.filter((booking) => booking.status === 'completed').length;
      const todaysBookings = modernBookings.filter((booking) => new Date(booking.createdAt) >= today).length
        + legacyBookings.filter((booking) => new Date(booking.createdAt) >= today).length;
      const activeBuses = buses.filter(isBusActive).length;

      return res.status(200).json({
        success: true,
        data: {
          user,
          roleProfile,
          notifications,
          stats: {
            totalDrivers,
            totalParents,
            totalBuses,
            totalRoutes,
            activeBuses,
            activeDrivers,
            totalBookings,
            pendingBookings,
            completedBookings,
            todaysBookings,
            revenue: revenueSummary?.[0]?.total || 0
          },
          recentBookings: recentBookings.map(mapBookingModel),
          recentBuses: buses.slice(0, 5),
          recentRoutes: routes.slice(0, 5),
          recentPayments
        }
      });
    }

    const bookingQuery = user.role === 'parent'
      ? { parent_id: userId }
      : { studentId: userId };

    const bookingPromise = user.role === 'parent'
      ? bookingModel.find(bookingQuery).populate('route_id').populate('vehicle').populate('driver_id', 'name email phone_number profile_photo').sort({ createdAt: -1 })
      : bookingNewModel.find(bookingQuery).populate('busId').sort({ createdAt: -1 });

    const [bookings, buses, routes] = await Promise.all([
      bookingPromise,
      busModel.find({}).sort({ createdAt: -1 }).limit(12),
      routeModel.find({}).populate('driver', 'name email role profile_photo isAvailable').sort({ createdAt: -1 }).limit(12)
    ]);

    const normalizedBookings = bookings.map(mapBookingModel);
    const latestBooking = normalizedBookings[0] || null;
    const latestBookingDoc = bookings[0] || null;
    const latestBus = latestBookingDoc?.busId || latestBookingDoc?.vehicle || null;
    const assignedBus = user.role === 'parent'
      ? latestBooking?.bus || latestBooking?.vehicle || null
      : latestBookingDoc?.busId || buses[0] || null;
    const confirmedBookings = user.role === 'parent'
      ? normalizedBookings.filter((booking) => booking.status === 'accepted' || booking.status === 'completed')
      : normalizedBookings.filter((booking) => booking.bookingStatus === 'Confirmed');
    const pendingBookings = normalizedBookings.filter((booking) => booking.status === 'pending' || booking.bookingStatus === 'Pending' || booking.bookingStatus === 'Payment Pending');
    const cancelledBookings = normalizedBookings.filter((booking) => booking.status === 'rejected' || booking.bookingStatus === 'Cancelled');
    const liveBus = buses.find(isBusActive) || buses[0] || null;
    const routeInfo = user.role === 'parent'
      ? latestBooking?.route || null
      : latestBookingDoc?.busId?.route || latestBooking?.bus?.routeName || latestBooking?.route || null;

    const rideSummary = user.role === 'parent'
      ? {
          fromLabel: 'From Home',
          fromAddress: roleProfile?.pickup_address || latestBookingDoc?.pickup_point || 'Pickup location pending',
          toLabel: 'To School',
          toAddress: roleProfile?.school_name || roleProfile?.drop_address || latestBookingDoc?.drop_point || 'School destination pending',
          pickupTime: latestBookingDoc?.createdAt ? new Date(latestBookingDoc.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : 'Pending'
        }
      : {
          fromLabel: 'Pickup Stop',
          fromAddress: latestBooking?.pickupStop || latestBooking?.pickupPoint || roleProfile?.pickup_address || 'Pickup stop pending',
          toLabel: 'Destination',
          toAddress: latestBooking?.dropStop || latestBooking?.dropPoint || roleProfile?.school_name || 'School destination pending',
          pickupTime: latestBookingDoc?.createdAt ? new Date(latestBookingDoc.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : 'Pending'
        };

    return res.status(200).json({
      success: true,
      data: {
        user,
        roleProfile,
        notifications,
        stats: {
          totalRides: normalizedBookings.length,
          confirmedRides: confirmedBookings.length,
          pendingRides: pendingBookings.length,
          cancelledRides: cancelledBookings.length,
          unreadNotifications: notifications.filter((item) => !item.read).length
        },
        dashboard: {
          welcomeName: user.name,
          welcomeRole: user.role,
          profilePhoto: user.profile_photo,
          upcomingRide: latestBooking,
          assignedBus,
          routeInfo,
          rideSummary,
          wallet: {
            balance: user.role === 'student' ? 0 : Math.max(0, pendingBookings.length * 250),
            lastActivity: latestBooking?.updatedAt || user.updatedAt
          },
          liveBus,
          recentActivity: normalizedBookings.slice(0, 4),
          liveBuses: buses.filter(isBusActive).slice(0, 6),
          availableRoutes: routes.slice(0, 6)
        }
      }
    });
  } catch (error) {
    console.error('Get Dashboard Overview Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAssignmentOptions = async (req, res) => {
  try {
    const allowReassignment = String(req.query.allowReassignment || 'false').toLowerCase() === 'true';
    const [drivers, buses, routes] = await Promise.all([
      getEligibleDrivers({ allowReassignment }),
      busModel.find({}).populate('driver', 'name email role isAvailable profile_photo').populate('route').sort({ createdAt: -1 }),
      routeModel.find({}).populate('driver', 'name email role isAvailable profile_photo').populate('assignedBus').sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        drivers,
        buses,
        routes
      }
    });
  } catch (error) {
    console.error('Get Assignment Options Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const changeLanguage = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { preferred_language } = req.body;
    if (!preferred_language) {
      return res.status(400).json({ success: false, message: "Language is required" });
    }
    const user = await userModel.findByIdAndUpdate(
      userId,
      { preferred_language },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, message: "Language updated", user });
  } catch (error) {
    console.error("Change Language Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteAccount = async (req,res)=>{
  try{
    const userId = req.user?.id;

    if(!userId){
      return res.status(401).json({
        success:false,
        message:"Unauthorized"
      });
    }

    const user = await userModel.findById(userId);

    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }

    // Ensure parent profile is removed as requested.
    if (user.role === 'parent') {
      await parentProfile.deleteOne({ user_id: user._id });
    }

    await userModel.findByIdAndDelete(user._id);

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.json({
      success:true,
      message:"Account deleted successfully"
    })

  }
  catch(error){
    console.log("Delete account error:",error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

export const createSupportTicket = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }
    const ticket = await SupportTicket.create({ user_id: userId, subject, message });
    return res.status(201).json({ success: true, message: "Ticket created", ticket });
  } catch (error) {
    console.error("Create Support Ticket Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const notifications = await notificationModel
      .find({ user: userId })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
