import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    customerName: { type: String, required: true },
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "Approved" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;