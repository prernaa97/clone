import Doctor from "../models/doctor.js";

// ✅ Create Doctor
export const createDoctor = async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json({ success: true, message: "Doctor created", data: doctor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get All Doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Doctor
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, message: "Doctor updated", data: doctor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.status(200).json({ success: true, message: "Doctor deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
