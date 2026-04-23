import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usersApi } from "../api/client";

export default function LoginPage() {
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
      const response = await usersApi.login({
        email: form.email,
        password: form.password,
      });

      if (response?.user) {
        localStorage.setItem("medix_user", JSON.stringify(response.user));
      }
      navigate("/billing");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-head">
          <p className="auth-kicker">Welcome Back</p>
          <h1>User Login</h1>
          <p>Sign in with your user account.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Signing In..." : "Login"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
        <p className="auth-bottom-text">
          Admin account? <Link to="/admin/login">Use admin login</Link>
        </p>
      </div>
    </div>
  );
}
