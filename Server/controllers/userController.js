import userModel from "../models/userModel.js";
import DriverProfile from "../models/DriverProfile.js";
import parentProfile from "../models/parentProfile.js";
import notificationModel from "../models/notificationModel.js";
import SupportTicket from "../models/supportTicket.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if(!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
  
    const user = await userModel.findById(userId).select("-password");

    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    let roleProfile = null;

    if(user.role === 'driver') {
      roleProfile = await DriverProfile.findOne({user_id: userId});
    } 
    else if(user.role === 'parent') {
      roleProfile = await parentProfile.findOne({user_id: userId});
    }

    return res.status(200).json({
      success: true,
      user,
      roleProfile
    })
  }
  catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

export const updateProfile = async (req,res) => {
  try {
    const userId = req.user?.id;

    if(!userId){
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }

    const {name, preferred_language, profile_photo, phone_number} = req.body;

    const updateData = {};

    if(name) updateData.name = name;
    if(preferred_language) updateData.preferred_language = preferred_language;
    if(profile_photo) updateData.profile_photo = profile_photo;
    if(phone_number !== undefined){
      const normalizedPhone = String(phone_number).trim();

      if(!/^\d{10}$/.test(normalizedPhone)){
        return res.status(400).json({
          success: false,
          message: "Phone number must be a valid 10-digit number"
        });
      }

      updateData.phone_number = normalizedPhone;
    }

    if(Object.keys(updateData).length === 0){
      return res.status(400).json({
        success: false,
        message: "No data provided to update"
      })
    }

    const user = await userModel.findByIdAndUpdate(userId, updateData,{ new: true}).select("-password");

    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  }
  catch(error) {
    if(error?.code === 11000 && error?.keyPattern?.phone_number){
      return res.status(400).json({
        success: false,
        message: "Phone number already in use"
      });
    }

    console.log("Update Profile Error: ", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

export const getParentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'parent') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const profile = await parentProfile.findOne({ user_id: userId });
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Get Parent Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateParentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'parent') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { pickup_address, drop_address } = req.body;
    const updateData = {};
    if (pickup_address) updateData.pickup_address = pickup_address;
    if (drop_address) updateData.drop_address = drop_address;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No data provided to update" });
    }
    const profile = await parentProfile.findOneAndUpdate({ user_id: userId }, updateData, { new: true, upsert: true });
    return res.json({ success: true, message: "Parent profile updated", profile });
  } catch (error) {
    console.error("Update Parent Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const profile = await DriverProfile.findOne({ user_id: userId });
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Get Driver Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateDriverProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const {
      vehicle_number,
      vehicle_type,
      license_number,
      vehicle_seats,
      profile_photo,
    } = req.body;
    const updateData = {};
    if (vehicle_number) updateData.vehicle_number = vehicle_number;
    if (vehicle_type) updateData.vehicle_type = vehicle_type;
    if (license_number) updateData.license_number = license_number;
    if (vehicle_seats !== undefined) updateData.vehicle_seats = vehicle_seats;
    if (profile_photo) updateData.profile_photo = profile_photo;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No data provided to update" });
    }
    const profile = await DriverProfile.findOneAndUpdate({ user_id: userId }, updateData, { new: true, upsert: true });
    return res.json({ success: true, message: "Driver profile updated", profile });
  } catch (error) {
    console.error("Update Driver Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const changeLanguage = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { preferred_language } = req.body;
    if (!preferred_language) {
      return res.status(400).json({ success: false, message: "Language is required" });
    }
    const user = await userModel.findByIdAndUpdate(
      userId,
      { preferred_language },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, message: "Language updated", user });
  } catch (error) {
    console.error("Change Language Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteAccount = async (req,res)=>{
  try{

    let { email } = req.body;

    if(!email){
      return res.status(400).json({
        success:false,
        message:"Email is required"
      })
    }

    email = email.toLowerCase().trim();

    const user = await userModel.findOne({ email });

    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }

    await userModel.findOneAndDelete({ email });

    return res.json({
      success:true,
      message:"Account deleted successfully"
    })

  }
  catch(error){
    console.log("Delete account error:",error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

export const createSupportTicket = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }
    const ticket = await SupportTicket.create({ user_id: userId, subject, message });
    return res.status(201).json({ success: true, message: "Ticket created", ticket });
  } catch (error) {
    console.error("Create Support Ticket Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const notifications = await notificationModel
      .find({ user: userId })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
