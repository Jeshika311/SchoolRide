import trackingModel from '../models/trackingModel.js';
import busModel from '../models/busModel.js';

// Update bus location (POST /api/tracking/update-location)
export const updateBusLocation = async (req, res, next) => {
  try {
    const { busId, latitude, longitude, speed } = req.body;

    if (!busId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Bus ID, latitude, and longitude are required.'
      });
    }

    // 1. Verify bus exists
    const bus = await busModel.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    // 2. Update Bus model's currentLocation
    bus.currentLocation = { lat: latitude, lng: longitude };
    await bus.save();

    // 3. Upsert Tracking record
    const tracking = await trackingModel.findOneAndUpdate(
      { busId },
      { latitude, longitude, speed: speed || 0 },
      { new: true, upsert: true }
    );

    // 4. Emit location update to connected sockets
    const io = req.app.get('io');
    if (io) {
      io.emit(`bus-location-${busId}`, {
        busId,
        latitude,
        longitude,
        speed: speed || 0,
        updatedAt: tracking.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus location updated successfully.',
      data: tracking
    });
  } catch (error) {
    next(error);
  }
};

// Fetch bus live tracking coordinates (GET /api/tracking/:busId)
export const getBusLocation = async (req, res, next) => {
  try {
    const { busId } = req.params;

    const tracking = await trackingModel.findOne({ busId });
    if (!tracking) {
      // Fallback: If no tracking entry exists yet, try to read from Bus model directly
      const bus = await busModel.findById(busId);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found.'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          busId: bus._id,
          latitude: bus.currentLocation?.lat || 0.0,
          longitude: bus.currentLocation?.lng || 0.0,
          speed: 0,
          updatedAt: bus.updatedAt
        }
      });
    }

    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    next(error);
  }
};
