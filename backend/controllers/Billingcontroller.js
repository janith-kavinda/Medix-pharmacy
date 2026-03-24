import Billing from "../models/Billingmodel.js";

// CREATE BILL
export const createBilling = async (req, res) => {
  try {

    const { customerName, medicineName, quantity, price } = req.body;

    const total = quantity * price;

    const bill = new Billing({
      customerName,
      medicineName,
      quantity,
      price,
      total
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

    const bills = await Billing.find();

    res.json(bills);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE BILL
export const updateBilling = async (req, res) => {
  try {

    const { customerName, medicineName, quantity, price } = req.body;

    const total = quantity * price;

    const updated = await Billing.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        medicineName,
        quantity,
        price,
        total
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
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