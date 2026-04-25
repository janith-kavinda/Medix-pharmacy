import express from "express";
import {
  signupUser,
  loginUser,
  adminLoginUser,
  adminSignupUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/Usercontroller.js";

const router = express.Router();

// Auth s
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/admin-login", adminLoginUser);
router.post("/admin-signup", adminSignupUser);

// CRUD s
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
