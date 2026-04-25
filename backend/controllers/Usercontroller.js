import User from "../models/Usermodel.js";

const sanitizeUser = (userDoc) => ({
  _id: userDoc._id,
  fullName: userDoc.fullName,
  email: userDoc.email,
  role: userDoc.role,
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
});

export const signupUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "fullName, email, and password are required" });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: String(email).toLowerCase().trim(),
      password: String(password),
      role: "user",
    });

    return res.status(201).json({ message: "User registered successfully", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to register user" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.password !== String(password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (String(user.role).toLowerCase() === "admin") {
      return res.status(403).json({ error: "Use admin login for admin accounts" });
    }

    return res.status(200).json({ message: "Login successful", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to login" });
  }
};

export const adminLoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid admin email or password" });
    }

    if (String(user.role).toLowerCase() !== "admin") {
      return res.status(403).json({ error: "This account is not an admin account" });
    }

    if (user.password !== String(password)) {
      return res.status(401).json({ error: "Invalid admin email or password" });
    }

    return res.status(200).json({ message: "Admin login successful", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to login" });
  }
};

export const adminSignupUser = async (req, res) => {
  try {
    const { fullName, email, password, adminSecret } = req.body;

    // Simple secret key check
    if (adminSecret !== "YOUR_SECRET_KEY") {
      return res.status(403).json({ error: "Invalid admin secret key." });
    }

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Full name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Remember to hash passwords in a real application
      role: "admin",
    });

    res.status(201).json({
      message: "Admin user created successfully.",
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create admin user." });
  }
};
// usercontroller
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users.map(sanitizeUser));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
//user controller s


export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (email) {
      const normalized = String(email).toLowerCase().trim();
      const exists = await User.findOne({ email: normalized, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    const payload = {};
    if (fullName !== undefined) payload.fullName = String(fullName).trim();
    if (email !== undefined) payload.email = String(email).toLowerCase().trim();
    if (password !== undefined) payload.password = String(password);
    if (role !== undefined) payload.role = String(role).trim();

    const updated = await User.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "User updated successfully", user: sanitizeUser(updated) });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to update user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
};
