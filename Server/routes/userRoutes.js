import express from 'express';
import {
  getProfile,
  updateProfile,
  getParentProfile,
  updateParentProfile,
  getDriverProfile,
  updateDriverProfile,
  updateDriverAvailability,
  getDriverDashboard,
  changeLanguage,
  deleteAccount,
  createSupportTicket,
  getNotifications
} from '../controllers/userController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const userRouter = express.Router();

// profile endpoints
userRouter.get('/getProfile', AuthMiddleware, getProfile);
userRouter.put('/updateProfile', AuthMiddleware, updateProfile);

// parent-specific
userRouter.get('/getParentProfile', AuthMiddleware, getParentProfile);
userRouter.put('/updateParentProfile', AuthMiddleware, updateParentProfile);

// driver-specific
userRouter.get('/getDriverProfile', AuthMiddleware, getDriverProfile);
userRouter.put('/updateDriverProfile', AuthMiddleware, updateDriverProfile);
userRouter.put('/updateDriverAvailability', AuthMiddleware, RoleMiddleware('driver'), updateDriverAvailability);
userRouter.get('/driver-dashboard', AuthMiddleware, RoleMiddleware('driver'), getDriverDashboard);

// misc
userRouter.put('/changeLanguage', AuthMiddleware, changeLanguage);
userRouter.delete('/deleteAccount', AuthMiddleware, deleteAccount);
userRouter.post('/createSupportTicket', AuthMiddleware, createSupportTicket);
userRouter.get('/getNotifications', AuthMiddleware, getNotifications);

export default userRouter;