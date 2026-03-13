import vehicleModel from '../models/vehicleModel.js';

export const createVehicle = async (req, res) => {
  try {
    const { driver_id, vehicle_number, total_seats, available_seats } = req.body;

    if (!driver_id || !vehicle_number || !total_seats || available_seats === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const newVehicle = new vehicleModel({
      driver_id,
      vehicle_number,
      total_seats,
      available_seats
    });

    await newVehicle.save();

    // when a driver creates a vehicle, update their profile's vehicle_seats
    try {
      const DriverProfile = (await import('../models/DriverProfile.js')).default;
      await DriverProfile.findOneAndUpdate(
        { user_id: driver_id },
        { vehicle_seats: total_seats },
        { upsert: true }
      );
    } catch (err) {
      // profile update failure should not block vehicle creation
      console.error('Failed to sync driver profile seats:', err);
    }

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: newVehicle
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with that number already exists"
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleModel.find().populate('driver_id', 'name email');
    res.status(200).json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehicleModel.findById(id).populate('driver_id', 'name email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
 
export const getVehiclesByDriver = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const vehicles = await vehicleModel.find({ driver_id }).populate('driver_id', 'name email');

    res.status(200).json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedVehicle = await vehicleModel.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true, context: 'query' } // ensure validator sees update values
    );

    // if total_seats was changed, sync it to the driver's profile as well
    if (updates.total_seats !== undefined) {
      try {
        const DriverProfile = (await import('../models/DriverProfile.js')).default;
        // determine driver_id either from updatedVehicle or payload
        const driverId = updatedVehicle.driver_id || updates.driver_id;
        if (driverId) {
          await DriverProfile.findOneAndUpdate(
            { user_id: driverId },
            { vehicle_seats: updates.total_seats },
            { upsert: true }
          );
        }
      } catch (err) {
        console.error('Failed to sync driver profile seats after update:', err);
      }
    }

    if (!updatedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with that number already exists"
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVehicle = await vehicleModel.findByIdAndDelete(id);

    if (!deletedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
