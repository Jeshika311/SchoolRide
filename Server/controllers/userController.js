import userModel from "../models/userModel.js";
import DriverProfile from "../models/DriverProfile.js";
import parentProfile from "../models/parentProfile.js";

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

    const {name, preferred_language, profile_photo} = req.body;

    const updateData = {};

    if(name) updateData.name = name;
    if(preferred_language) updateData.preferred_language = preferred_language;
    if(profile_photo) updateData.profile_photo = profile_photo;

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
    console.log("Update Profile Error: ", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

