import DoctorProfile from "../models/doctorProfile.js";

export const createDoctorProfile = async (req, res) => {
  try {
    const profile = new DoctorProfile(req.body);
    await profile.save();
    res.status(201).json({ success: true, message: "Doctor profile created successfully", data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating doctor profile", error: error.message });
  }
};

// ✅ Get All Profiles
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await DoctorProfile.find().populate("doctorId", "name email phone");
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profiles", error: error.message });
  }
};

// ✅ Get Single Profile by ID
export const getProfileById = async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id).populate("doctorId", "name email phone");
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profile", error: error.message });
  }
};

// ✅ Update Profile
export const updateDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    res.status(200).json({ success: true, message: "Profile updated successfully", data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating profile", error: error.message });
  }
};

// ✅ Delete Profile
export const deleteDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findByIdAndDelete(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    res.status(200).json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting profile", error: error.message });
  }
};
