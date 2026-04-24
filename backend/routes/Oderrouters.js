import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "../controllers/Odercontrollers.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/user/:userId", getOrdersByUser);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;