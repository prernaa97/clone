import Clinic from "../models/clinic.js";
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import DoctorProfile from "../models/doctorProfile.js";

// Create a new clinic
// export const createClinic = async (req, res) => {
//   try {
//     const { doctorId, clinicName, clinicAddress, city, consultationFee, clinicTiming } = req.body;
//     console.log("Request.body: ", req.body);

//     if (!doctorId || !clinicName || !clinicAddress || !city || !consultationFee || !clinicTiming) {
//       return res.status(400).json({ success: false, message: "All required fields must be provided" });
//     }
//     if (typeof consultationFee !== "number" || consultationFee <= 0) {
//       return res.status(400).json({ success: false, message: "amount must be a positive number" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(doctorId)) {
//       return res.status(400).json({ success: false, message: "Invalid doctorId" });
//     }
//   var clinicExist = await Clinic.findOne({ doctorId: req.body.doctorId });

//     // if (clinicExist) {
//     // return res.status(400).json({ success: false, message: "Only one clinic can be registered per doctor" });
//     // }
//    const data = await Subscription.findOne();
//     console.log("DoctorId: ", data?.doctorId);

//     // Profile must be approved
//     const profile = await DoctorProfile.findOne({ userId: doctorId });
//     if (!profile || profile.status !== "Approved") {
//       return res.status(403).json({ success: false, message: "Doctor profile is not approved" });
//     }

//     // Active subscription required
//     const now = new Date();
//     const subscription = await Subscription.findOne({ doctorId, isActive: true, endDate: { $gte: now } });
//     if (!subscription) {
//       return res.status(404).json({ success: false, message: "Doctor does not have an active subscription" });
//     }

//     const newClinic = new Clinic({
//       doctorId,
//       clinicName: clinicName.trim(),
//       clinicAddress: clinicAddress.trim(),
//       city: city.trim(),
//       consultationFee,
//       clinicTiming
//     });

//     const savedClinic = await newClinic.save();
//     res.status(201).json({ success: true, data: savedClinic });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// Get all clinics
export const getAllClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find().populate("doctorId", "name email");
    res.status(200).json({ success: true, data: clinics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get clinic by ID
export const getClinicById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid clinic ID" });

    const clinic = await Clinic.findById(id).populate("doctorId", "name email");
    if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found" });
    console.log("Clinic DocterId: ", clinic);
    res.status(200).json({ success: true, data: clinic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get clinic by Doctor ID
export const getClinicByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId))
      return res.status(400).json({ success: false, message: "Invalid doctor ID" });

    const clinic = await Clinic.findOne({ doctorId }).populate("doctorId", "name email");
    if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found for this doctor" });
    
    res.status(200).json({ success: true, clinic: clinic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update clinic
export const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinicName, clinicAddress, city, consultationFee, clinicTiming } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid clinic ID" });

    const clinic = await Clinic.findById(id);
    if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found" });

    // Update only provided fields
    if (clinicName) clinic.clinicName = clinicName.trim();
    if (clinicAddress) clinic.clinicAddress = clinicAddress.trim();
    if (city) clinic.city = city.trim();
    if (consultationFee) clinic.consultationFee = consultationFee;
    if (clinicTiming) clinic.clinicTiming = clinicTiming;

    const updatedClinic = await clinic.save();
    res.status(200).json({ success: true, data: updatedClinic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete clinic
export const deleteClinic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid clinic ID" });

    const deleted = await Clinic.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Clinic not found" });

    res.status(200).json({ success: true, message: "Clinic deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
