import express from 'express';
import {
  createTransportEvent,
  getTransportEvents,
  getChildTransportEvents,
  getLiveCabStatus
} from '../controllers/transportEventController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const transportRouter = express.Router();

transportRouter.use(AuthMiddleware);

transportRouter.route('/')
  .post(RoleMiddleware('driver', 'admin', 'manager'), createTransportEvent)
  .get(RoleMiddleware('admin', 'manager'), getTransportEvents);

transportRouter.route('/live/:cabId')
  .get(getLiveCabStatus);

transportRouter.route('/:childId')
  .get(getChildTransportEvents);

export default transportRouter;
