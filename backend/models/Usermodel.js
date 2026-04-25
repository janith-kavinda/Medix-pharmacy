import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "user", trim: true },
  },
  { timestamps: true }
);
//user

const User = mongoose.model("User", userSchema);
//usermodels  s

export default User;
