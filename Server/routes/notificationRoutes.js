import express from "express";
import { sendNotification } from "../controllers/notificationController.js";

const NotificationRouter = express.Router();

NotificationRouter.post("/send", sendNotification);

export default NotificationRouter;