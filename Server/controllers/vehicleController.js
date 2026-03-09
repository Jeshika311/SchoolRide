import vehicleModel from '../models/vehicleModel.js';

// Create a new vehicle
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

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: newVehicle
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get all vehicles
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

// Get vehicle by ID
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

// Get vehicles by driver ID
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

// Update vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedVehicle = await vehicleModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

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
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete vehicle
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
