// import admin from "../config/firebase.js";
import userModel from "../models/userModel.js";

export const sendNotification = async (req, res) => {
  try {
    const { user_id, title, body } = req.body;

    if (!user_id || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "user_id, title and body are required"
      });
    }

    const user = await userModel.findById(user_id);

    if (!user || !user.device_token) {
      return res.status(404).json({
        success: false,
        message: "User or device token not found"
      });
    }

    const message = {
      token: user.device_token,
      notification: {
        title,
        body
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      }
    };

    const response = await admin.messaging().send(message);

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      response
    });

  } catch (error) {
    console.error("Notification error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};