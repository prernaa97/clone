import mongoose from "mongoose";

const { Schema } = mongoose;

// Permission Schema
const permissionSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 255,
  },
  canRead: {
    type: Boolean,
    default: false,
  },
  canWrite: {
    type: Boolean,
    default: false,
  },
});

// RolePermission Schema ( Role & Permission)
const rolePermissionSchema = new Schema({
  roleId: {
    type: Schema.Types.ObjectId, 
    ref: "Role",
    required: true,
  },
  permissionId: {
    type: Schema.Types.ObjectId, // Permission reference
    ref: "Permission",
    required: true,
  },
  canRead: {
    type: Boolean,
    default: false,
  },
  canWrite: {
    type: Boolean,
    default: false,
  },
});

const Permission = mongoose.model("Permission", permissionSchema);
const RolePermission = mongoose.model("RolePermission", rolePermissionSchema);

export { Permission, RolePermission };
