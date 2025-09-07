import DoctorProfile from "../models/doctorProfile.js";
import User from "../models/user.js";

export const submitDoctorProfile = async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    console.log("submitDoctorProfile: ",req.body);
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    const user = await User.findOne({ _id: userId });
    console.log(user._id);
    if(!user){
      return res.status(400).json({ success: false, message: "UserId not Exists" });
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          ...profileData,
           userId: user._id,
          isProfileRequest: true,
          status: "pending",
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({ success: true, message: "Profile submitted to Admin", profile });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const approveDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await DoctorProfile.findByIdAndUpdate(
      id,
      { $set: { status: "Approved" } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    return res.json({ success: true, message: "Profile approved", profile });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await DoctorProfile.findByIdAndUpdate(
      id,
      { $set: { status: "Rejected" } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    return res.json({ success: true, message: "Profile rejected (kept for audit/notify)", profile });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


