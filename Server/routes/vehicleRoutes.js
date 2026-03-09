import express from 'express';
import { createVehicle, getVehicles, getVehicleById, getVehiclesByDriver, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';

const vehicleRouter = express.Router();

// Create a new vehicle
vehicleRouter.post('/', createVehicle);

// Get all vehicles
vehicleRouter.get('/', getVehicles);

// Get vehicle by ID
vehicleRouter.get('/:id', getVehicleById);

// Get vehicles by driver ID
vehicleRouter.get('/driver/:driver_id', getVehiclesByDriver);

// Update vehicle
vehicleRouter.put('/:id', updateVehicle);

// Delete vehicle
vehicleRouter.delete('/:id', deleteVehicle);

export default vehicleRouter;
