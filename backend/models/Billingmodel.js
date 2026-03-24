import mongoose from "mongoose";

const BillingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    default: "Walk-in"
  },

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
  }

}, { timestamps: true });

const Billing = mongoose.model("Billing", BillingSchema);

export default Billing;