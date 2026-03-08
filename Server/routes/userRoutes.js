import express from 'express';
import {
  getProfile,
  updateProfile,
  getParentProfile,
  updateParentProfile,
  getDriverProfile,
  updateDriverProfile,
  changeLanguage,
  deleteAccount,
  createSupportTicket,
  getNotifications
} from '../controllers/userController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

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

// misc
userRouter.put('/changeLanguage', AuthMiddleware, changeLanguage);
userRouter.delete('/deleteAccount', AuthMiddleware, deleteAccount);
userRouter.post('/createSupportTicket', AuthMiddleware, createSupportTicket);
userRouter.get('/getNotifications', AuthMiddleware, getNotifications);

export default userRouter;