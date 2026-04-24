import express from "express";
import {
	createBilling,
	getBillings,
	getBillingById,
	updateBilling,
	deleteBilling,
	markBillingPaid,
} from "../controllers/Billingcontroller.js";

const router = express.Router();

router.post("/", createBilling);
router.get("/", getBillings);
router.get("/:id", getBillingById);
router.put("/:id", updateBilling);
router.delete("/:id", deleteBilling);
router.post("/:id/mark-paid", markBillingPaid);


export default router;