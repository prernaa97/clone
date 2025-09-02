import Role from "../models/role.model.js";
import Permission from "../models/permission.model.js";
import RolePermission from "../models/rolePermission.model.js";
import UserRole from "../models/userRole.model.js";

export const createRole = async (req, res) => {
  try {
    const { roleName, permissions } = req.body; 
    // permissions = [{ permissionId, canRead, canWrite }]
    
    const role = await Role.create({ name: roleName });

    for (let perm of permissions) {
      await RolePermission.create({
        roleId: role._id,
        permissionId: perm.permissionId,
        canRead: perm.canRead,
        canWrite: perm.canWrite,
      });
    }

    return res.status(201).json({ success: true, role }); 
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });  
  }
};
// Assign Role to User

export const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const userRole = await UserRole.create({ userId, roleId });
    return res.status(201).json({ success: true, userRole });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

//Get User Roles + Permissions
export const getUserRolesAndPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const userRoles = await UserRole.find({ userId }).populate("roleId");
    const roles = userRoles.map(ur => ur.roleId.name);

    // collect permissions for each role
    const roleIds = userRoles.map(ur => ur.roleId._id);
    const rolePermissions = await RolePermission.find({ roleId: { $in: roleIds } })
      .populate("permissionId");

    const permissions = rolePermissions.map(rp => ({
      role: rp.roleId,
      permission: rp.permissionId.name,
      canRead: rp.canRead,
      canWrite: rp.canWrite
    }));

    return res.json({ roles, permissions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

