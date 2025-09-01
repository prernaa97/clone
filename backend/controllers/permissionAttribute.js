// helpers/hasPermission.js
import { hasPermission } from "../helpers/hasPermission.js";
import Subscription from "../models/Subscription.js";
import { RolePermission } from "../models/permission.js";
import { Role } from "../models/roles.js";

export const hasPermission = (user, permission, requireWrite = false) => {
  if (!user) return false;

  // 🔹 Admin has full access
  if (user.roles && user.roles.some(r => r.name === "Admin")) {
    return true;
  }

  // 🔹 User permissions check (assuming user.permissions is populated)
  const perm = user.permissions?.find(
    (p) => p.name === permission
  );

  if (!perm) return false;

  if (requireWrite) {
    return perm.canWrite === true;
  }

  return perm.canRead === true || perm.canWrite === true;
};

export const requirePermission = (permission, requireWrite = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // ⬅️ JWT se attach kiya hua user

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Tenant check with subscription validation
      if (user.roles.some(r => r.name === "Tenant")) {
        const subscription = await Subscription.findOne({ 
          userId: user._id 
        }).sort({ endDate: -1 });

        if (!subscription || !subscription.isActive || subscription.endDate <= new Date()) {
          return res.status(403).json({ message: "Subscription expired" });
        }
      }

      // Permission check
      if (!hasPermission(user, permission, requireWrite)) {
        return res.status(403).json({ message: "Access Denied" });
      }

      next();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
};

// middlewares/permissionDbHandler.js

export const requirePermissionDb = (permissionName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Admin bypass
      if (user.roles.some(r => r.name === "Admin")) {
        return next();
      }

      // Get role IDs
      const roleIds = user.roles.map(r => r._id);

      const hasPermission = await RolePermission.findOne({
        roleId: { $in: roleIds },
      }).populate("permissionId");

      if (hasPermission && hasPermission.permissionId.name === permissionName) {
        return next();
      }

      return res.status(403).json({ message: "Permission denied" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
};


