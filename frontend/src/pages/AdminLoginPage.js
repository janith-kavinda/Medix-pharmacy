import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { usersApi } from "../api/client";
import MedixButton from "../components/ui/MedixButton";

function isStoredAdmin() {
  try {
    const raw = localStorage.getItem("medix_user");
    const u = raw ? JSON.parse(raw) : null;
    return Boolean(u && String(u.role).toLowerCase() === "admin");
  } catch {
    return false;
  }
}

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

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Admin login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isStoredAdmin()) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-admin">
        <div className="auth-head">
          <p className="auth-kicker">Pharmacy staff</p>
          <h1>Admin sign in</h1>
          <p>Sign in to the pharmacy dashboard (inventory, orders, billing).</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-row">
            <label htmlFor="admin-login-email">Admin email</label>
            <input
              id="admin-login-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="admin@medix.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="admin-login-password">Password</label>
            <input
              id="admin-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <MedixButton type="submit" variant="primary" block disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in to dashboard"}
          </MedixButton>
        </form>

        <p className="auth-bottom-text">
          <Link to="/login">User sign in</Link>
        </p>
      </div>
    </div>
  );
}