import Billing from "../models/Billingmodel.js";
import mongoose from "mongoose";

const toNumber = (value) => Number(value) || 0;

// CREATE BILL
export const createBilling = async (req, res) => {
  try {
    const {
      orderId = null,
      customerName,
      medicineName,
      quantity,
      price,
      paymentStatus,
    } = req.body;

    const normalizedOrderId = orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : null;

    const qty = toNumber(quantity);
    const unitPrice = toNumber(price);
    const total = qty * unitPrice;

    const bill = new Billing({
      orderId: normalizedOrderId,
      customerName,
      medicineName,
      quantity: qty,
      price: unitPrice,
      total,
      paymentStatus: paymentStatus === "Paid" ? "Paid" : "Pending",
    });

    const saved = await bill.save();

    res.status(201).json(saved);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET ALL BILLS
export const getBillings = async (req, res) => {
  try {
    const bills = await Billing.find().sort({ createdAt: -1 });

    res.json(bills);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET BILL BY ID
export const getBillingById = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE BILL
export const updateBilling = async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      medicineName,
      quantity,
      price,
      paymentStatus,
    } = req.body;

    const normalizedOrderId = orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : null;

    const qty = toNumber(quantity);
    const unitPrice = toNumber(price);
    const total = qty * unitPrice;

    const updated = await Billing.findByIdAndUpdate(
      req.params.id,
      {
        orderId: normalizedOrderId,
        customerName,
        medicineName,
        quantity: qty,
        price: unitPrice,
        total,
        paymentStatus: paymentStatus === "Paid" ? "Paid" : "Pending",
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// MARK BILL AS PAID
export const markBillingPaid = async (req, res) => {
  try {
    const updated = await Billing.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Paid" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// DELETE BILL
export const deleteBilling = async (req, res) => {
  try {

    const deleted = await Billing.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ message: "Bill deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};