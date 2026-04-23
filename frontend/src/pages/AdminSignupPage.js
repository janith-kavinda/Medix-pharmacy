import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usersApi } from "../api/client";

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    adminSecret: "",
  });
  const [error, setError] = useState(""); 
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await usersApi.adminSignup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        adminSecret: form.adminSecret,
      });

      if (response?.user) {
        // Redirect to admin login page after successful signup
        navigate("/admin/login");
      }
    } catch (err) {
      setError(err.message || "Admin signup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-head">
          <p className="auth-kicker">Admin Registration</p>
          <h1>Create Admin Account</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="adminSecret">Admin Secret Key</label>
            <input
              id="adminSecret"
              name="adminSecret"
              type="password"
              placeholder="Enter the secret key"
              value={form.adminSecret}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating Account..." : "Sign Up as Admin"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Already have an admin account? <Link to="/admin/login">Admin Login</Link>
        </p>
      </div>
    </div>
  );
}
