import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import inventoryRouter from "./routes/Inventryrouters.js";
import orderRouter from "./routes/Oderrouters.js";
import billingRouter from "./routes/Billingroute.js";

// Ensure dotenv is loaded before any code that reads process.env
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Medix Pharmacy API running!");
});

app.use("/api/medicines", inventoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/billings", billingRouter);

// MongoDB Connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
	console.error('Missing MONGO_URI in environment. Check backend/.env and ensure dotenv.config() runs before mongoose.connect().');
	process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));