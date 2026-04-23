import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usersApi } from "../api/client";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await usersApi.signup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });

      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-head">
          <p className="auth-kicker">Create Account</p>
          <h1>Sign Up For Medix Pharmacy</h1>
          <p>Set up your admin account to start managing your pharmacy.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Admin Name"
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
              placeholder="admin@medix.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row two-col">
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
