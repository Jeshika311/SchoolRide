import express from 'express';
import { getProfile } from '../controllers/userController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const userRouter = express.Router();

userRouter.post('/currentuser', AuthMiddleware, getProfile);
 
export default userRouter;