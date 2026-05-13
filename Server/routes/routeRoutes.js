import express from 'express';
import { createRoute, getRoutes, getRouteById, deleteRoute } from '../controllers/routeController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const routeRouter = express.Router();

// Apply AuthMiddleware to all route endpoints to ensure security (Production Grade)
routeRouter.use(AuthMiddleware);

routeRouter.route('/')
    .post(RoleMiddleware('admin', 'manager'), createRoute) // only admin/manager should create routes
    .get(getRoutes);

routeRouter.route('/:id')
    .get(getRouteById)
    .delete(RoleMiddleware('admin', 'manager'), deleteRoute);

export default routeRouter;
