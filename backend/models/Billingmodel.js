import mongoose from "mongoose";

const BillingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },

  customerName: {
    type: String,
    default: "Walk-in"
  },
//billing models
  medicineName: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  total: {
    type: Number,
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  }
//Billing
}, { timestamps: true });

const Billing = mongoose.model("Billing", BillingSchema);

export default Billing;