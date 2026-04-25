import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usersApi } from "../api/client";
import AdminPageShell from "../components/AdminPageShell";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function readLocalAdminId() {
  try {
    const raw = localStorage.getItem("medix_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?._id ? String(u._id) : null;
  } catch {
    return null;
  }
}

function isCustomerRole(role) {
  return String(role || "user").toLowerCase() !== "admin";
}

const emptyForm = () => ({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const currentAdminId = useMemo(() => readLocalAdminId(), []);

  const customers = useMemo(
    () =>
      (Array.isArray(users) ? users : []).filter((u) => isCustomerRole(u?.role)),
    [users]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((u) => {
      const name = String(u?.fullName || "").toLowerCase();
      const email = String(u?.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [customers, q]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const data = await usersApi.getAll();
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });
      setUsers(list);
    } catch (err) {
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAddForm = () => {
    setError("");
    setSuccess("");
    setForm(emptyForm());
    setShowForm(true);
  };

  const closeAddForm = () => {
    setError("");
    setForm(emptyForm());
    setShowForm(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (String(form.password).length < 1) {
      setError("Password is required.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await usersApi.signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess("Customer account created.");
      closeAddForm();
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    const id = String(user?._id || "");
    if (!id) return;
    if (String(id) === String(currentAdminId)) {
      setError("You cannot remove your own account from this screen.");
      return;
    }
    if (
      !window.confirm(
        "Delete this customer? Their account will be removed. This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setSavingId(id);
      setError("");
      setSuccess("");
      await usersApi.delete(id);
      setSuccess("Customer deleted.");
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to delete customer.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminPageShell breadcrumb="Users">
      <div className="users-page ph-admin-users">
        <div className="page-header">
          <div>
            <h1>Users</h1>
            <p className="page-subtitle">
              All registered store customers. Staff (admin) accounts are not
              listed here.
            </p>
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddForm}
              disabled={loading}
            >
              Add user
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {showForm && (
          <div className="card form-card">
            <h2>Add customer</h2>
            <p className="page-subtitle">
              Creates a store account with the customer role. They can sign in
              on the public site with this email and password.
            </p>
            <form onSubmit={handleCreateUser} noValidate>
              <div className="form-row two-col">
                <div>
                  <label htmlFor="new-user-name">Full name</label>
                  <input
                    id="new-user-name"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleFormChange}
                    required
                    autoComplete="name"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="new-user-email">Email</label>
                  <input
                    id="new-user-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    autoComplete="email"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="form-row two-col">
                <div>
                  <label htmlFor="new-user-password">Password</label>
                  <input
                    id="new-user-password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="new-user-confirm">Confirm password</label>
                  <input
                    id="new-user-confirm"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleFormChange}
                    required
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating…" : "Create user"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeAddForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="form-row">
            <label htmlFor="user-search">Search by name or email</label>
            <input
              id="user-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to filter…"
            />
          </div>
        </div>

        <div className="card table-card">
          <h2>Customers ({filtered.length})</h2>

          {loading ? (
            <div className="loading">Loading customers…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No customers found.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const id = String(user?._id || "");
                    const busy = savingId === id;
                    const isSelf = currentAdminId && id === String(currentAdminId);
                    return (
                      <tr key={id || user?.email}>
                        <td>{user?.fullName || "—"}</td>
                        <td>{user?.email || "—"}</td>
                        <td>
                          <span className="badge badge-pending">
                            {String(user?.role || "user")}
                          </span>
                        </td>
                        <td>{formatDateTime(user?.createdAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(user)}
                              disabled={busy || isSelf}
                              title={
                                isSelf
                                  ? "Cannot delete your own account"
                                  : "Delete customer"
                              }
                            >
                              {busy ? "…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}