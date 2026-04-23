import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usersApi } from "../api/client";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await usersApi.adminLogin({
        email: form.email,
        password: form.password,
      });

      if (response?.user) {
        localStorage.setItem("medix_user", JSON.stringify(response.user));
      }

      navigate("/app");
    } catch (err) {
      setError(err.message || "Admin login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-admin">
        <div className="auth-head">
          <p className="auth-kicker">Restricted Access</p>
          <h1>Admin Login</h1>
          <p>Only admin users can access the pharmacy admin panel.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <label htmlFor="email">Admin Email</label>
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

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter admin password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Signing In..." : "Admin Login"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Need an admin account? <Link to="/admin/signup">Create one here</Link>.
        </p>
      </div>
    </div>
  );
}
