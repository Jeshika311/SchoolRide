import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getAllPayments
} from '../controllers/paymentController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const paymentRouter = express.Router();

// Order creation & callback verification (Student only)
paymentRouter.post('/create-order', AuthMiddleware, RoleMiddleware('student'), createPaymentOrder);
paymentRouter.post('/verify', AuthMiddleware, RoleMiddleware('student'), verifyPayment);

// Transaction logs (Admin only)
paymentRouter.get('/', AuthMiddleware, RoleMiddleware('admin'), getAllPayments);

export default paymentRouter;
