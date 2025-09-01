import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema({
  name: {
    type: String,
    enum: ["Admin", "Doctor", "User"],
    required: true,
  },
});

const Role = mongoose.model("Role", roleSchema);
export default Role;
