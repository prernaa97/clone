import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Role from "../models/roles.js";
import UserRole from "../models/userRoles.js";
import mongoose from "mongoose";

// SIGNUP
export const signUp = async (req, res) => {
  console.log("Request Body:", req.body); 
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      contact_no: req.body.contact_no,
      dateOfBirth: req.body.dateOfBirth,
    });
    const result = await newUser.save();
    //  default role assignment in UserRoles
    let userRoleDoc = await Role.findOne({ name: "User" });
    if (!userRoleDoc) {
      userRoleDoc = await Role.create({ name: "User" });
    }
    await UserRole.updateOne(
      { userId: result._id, roleId: userRoleDoc._id },
      { $setOnInsert: { userId: result._id, roleId: userRoleDoc._id } },
      { upsert: true }
    );
    const payload = { sub: result._id.toString(), name: result.name, email: result.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
    return res.status(201).json({
      user: {
        _id: result._id,
        name: result.name,
        email: result.email,
        contact_no: result.contact_no,
        dateOfBirth: result.dateOfBirth,
      },
      token,
      message: "User created successfully.",
    });
  } catch (err) {
    console.error(err);
    //  Duplicate Email Error Handle
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ error: "Email already exists. Please use another email." });
    }
  // Agar validation error hai
  if (err.name === "ValidationError") {
  let errors = {};
  Object.keys(err.errors).forEach((key) => {
    errors[key] = err.errors[key].message;
  });
  return res.status(400).json({ error: errors });  // 400 client error
}
    return res.status(500).json({ error: "Internal server problem" });
  }
};


// SIGNIN
export const signIn = async (req, res) => {
  console.log("Sign in called");

  const { email, password } = req.body; 

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    if (user.failedLoginAttempts >= 3) {
      return res.status(403).json({
        error: "Too many failed attempts. Please reset your password.",
      });
    }

    const isMatch = user.checkPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      await user.save();
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // reset failed attempts on success
    user.failedLoginAttempts = 0;
    await user.save();

    const payload = { sub: user._id.toString(), name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    return res.status(200).json({
      message: "Sign in success",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Sign in error:", err);
        // Agar validation error hai
  if (err.name === "ValidationError") {
    // har field ka error message nikalna
    let errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }


    return res.status(500).json({ error: "Internal server problem" });
  }
};

//  Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { currentUserId, userRole } = req.query;

    let query = User.find().sort({ name: 1 }).populate("roles");

    if (userRole === "Tenant" && currentUserId) {
      query = User.find({
        userCreatedBy: new mongoose.Types.ObjectId(currentUserId),
      })
        .sort({ name: 1 })
        .populate("roles");
    }

    const users = await query.exec();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("roles").exec();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Create user + assign roles
export const createUser = async (req, res) => {
  try {
    const { userData, password, roles = [] } = req.body;

    const user = new User({ ...userData, password });
    await user.save();

    if (roles.length > 0) {
      const roleDocs = await Role.find({ name: { $in: roles } });
      user.roles = roleDocs.map((r) => r._id);
      await user.save();

      await logUserActivity(user._id, "Account Created", "User account was created");
    }

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Update user
export const updateUser = async (req, res) => {
  try {
    const { userData, roles = [] } = req.body;
    const { id } = req.params;

    const existingUser = await User.findById(id);
    if (!existingUser) return res.status(404).json({ message: "User not found" });

    Object.assign(existingUser, userData);

    if (roles.length > 0) {
      const roleDocs = await Role.find({ name: { $in: roles } });
      existingUser.roles = roleDocs.map((r) => r._id);
    }

    await existingUser.save();

    await logUserActivity(id, "Account Updated", "User account was updated");

    res.status(200).json(existingUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Delete user
export const deleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Get roles of a user
export const getUserRoles = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("roles");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user.roles.map((r) => r.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Get all roles
export const getAllRoles = async (req, res) => {
  try {
    const { userRole } = req.query;
    const allRoles = await Role.find();

    let filteredRoles = allRoles;

    if (userRole === "Admin") {
      filteredRoles = allRoles.filter((r) => ["Admin", "Tenant"].includes(r.name));
    } else if (userRole === "Tenant") {
      filteredRoles = allRoles.filter((r) => r.name === "User");
    }

    res.status(200).json(filteredRoles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Create new role
export const createRole = async (req, res) => {
  try {
    const { roleName } = req.body;

    const exists = await Role.findOne({ name: roleName });
    if (exists) return res.status(400).json({ message: "Role already exists" });

    const newRole = new Role({ name: roleName });
    await newRole.save();

    res.status(201).json(newRole);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
