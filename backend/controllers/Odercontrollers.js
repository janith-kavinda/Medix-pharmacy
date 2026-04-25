import Order from "../models/odermodel.js";

// CREATE
export const createOrder = async (req, res) => {
  try {
    const saved = await Order.create(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL (optional ?userId=… for the customer profile “my orders”)
export const getAllOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId != null && String(userId).trim() !== "") {
      const key = String(userId).trim();
      const orders = await Order.find({ userId: key }).sort({ createdAt: -1 });
      return res.json(orders);
    }
    const orders = await Order.find();
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ORDERS FOR A USER (define before :id route)
export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const key = String(userId).trim();
    const orders = await Order.find({ userId: key }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to load orders" });
  }
};

// READ ONE
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch {
    res.status(400).json({ error: "Invalid Order ID" });
  }
};

// UPDATE
export const updateOrder = async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
export const deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch {
    res.status(400).json({ error: "Invalid Order ID" });
  }
};