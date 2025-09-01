///customSignIn , signOut

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Role from "../models/roles.model.js";
import UserRole from "../models/userRoles.model.js";
import { Permission, RolePermission } from "../models/permission.model.js";

export const passwordSignIn = async (email, password) => {
  // Step 1: Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Step 2: Check password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  // Step 3: Get user roles
  const userRoles = await UserRole.find({ user_id: user._id }).populate("role_id");
  const roles = userRoles.map((ur) => ur.role_id.name);

  // Step 4: Get permissions for those roles
  const roleIds = userRoles.map((ur) => ur.role_id._id);
  const rolePermissions = await RolePermission.find({ roleId: { $in: roleIds } })
    .populate("permissionId");

  const permissions = rolePermissions.map((rp) => ({
    name: rp.permissionId.name,
    access: rp.canWrite ? "Write" : rp.canRead ? "Read" : "None",
  }));

  // Step 5: Generate JWT with claims
  const claims = {
    sub: user._id.toString(),
    name: user.name,
    email: user.email,
    roles,
    permissions,
  };

  const token = jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: "24h" });

  return { user, token, roles, permissions };
};

/**
 * Sign Out (logout)
 * In JWT based systems, logout is done client-side (delete token).
 * If you want server-side logout, you can implement a token blacklist.
 */
export const signOut = async (token) => {
  // Option A: On client → delete token from localStorage/cookie
  // Option B: Server side → maintain blacklist collection
  return { message: "Sign out successful. Token should be removed on client." };
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await passwordSignIn(email, password);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    await signOut(token);
    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
