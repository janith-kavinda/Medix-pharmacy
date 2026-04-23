import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../api/client";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("medix_user");
    if (!raw) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(raw);
      if (!user?._id) {
        navigate("/login");
        return;
      }

      setUserId(user._id);
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.email || "",
      }));
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError("User session missing. Please login again.");
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload = {
      fullName: form.fullName,
      email: form.email,
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      setSaving(true);
      setError("");
      const response = await usersApi.update(userId, payload);
      const updatedUser = response?.user;

      if (updatedUser) {
        localStorage.setItem("medix_user", JSON.stringify(updatedUser));
      }

      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Profile</h1>
          <p className="page-subtitle">Update your admin account details.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card form-card">
        <h2>Profile Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row two-col">
            <div>
              <label htmlFor="password">New Password (optional)</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Leave blank to keep existing"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
