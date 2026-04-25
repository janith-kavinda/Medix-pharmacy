import mongoose from "mongoose";

const getMongoUri = () =>
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MongoDB_URI ||
  process.env.MongoDBUri;

export const connectDB = () => {
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    console.error(
      "Missing MongoDB connection string in environment. Set one of: MONGO_URI, MONGODB_URI, MongoDB_URI. (Loaded via backend/.env)"
    );
    process.exit(1);
  }
  return mongoose
    .connect(mongoUri)
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch((err) => console.error("❌ DB Connection Error:", err));
};