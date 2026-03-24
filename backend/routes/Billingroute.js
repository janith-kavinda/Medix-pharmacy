import express from "express";
import { createBilling, getBillings, updateBilling, deleteBilling } from "../controllers/Billingcontroller.js";

const router = express.Router();

router.post("/", createBilling);
router.get("/", getBillings);
router.put("/:id", updateBilling);
router.delete("/:id", deleteBilling);


export default router;