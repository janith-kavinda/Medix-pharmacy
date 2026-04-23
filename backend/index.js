import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import inventoryRouter from "./routes/Inventryrouters.js";
import orderRouter from "./routes/Oderrouters.js";
import billingRouter from "./routes/Billingroute.js";
import userRouter from "./routes/Userroute.js";

// Ensure dotenv is loaded before any code that reads process.env
// Load from backend/.env even if the process is started from a different CWD.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

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
app.use("/api/users", userRouter);

// MongoDB Connection
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MongoDB_URI ||
  process.env.MongoDBUri;
if (!mongoUri) {
  console.error(
    "Missing MongoDB connection string in environment. Set one of: MONGO_URI, MONGODB_URI, MongoDB_URI. (Loaded via backend/.env)"
  );
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));