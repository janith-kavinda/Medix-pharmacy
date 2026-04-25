import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ordersApi, usersApi } from "../api/client";
import MedixButton from "../components/ui/MedixButton";
import "./UserProfilePage.css";

const ORDERS_PAGE_SIZE = 2;

const sessionShape = (u) => ({
  _id: u._id,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function displayRole(role) {
  const r = String(role || "user").toLowerCase();
  if (r === "admin") return "Administrator";
  return "Customer";
}

function formatRs(amount) {
  const value = Number(amount) || 0;
  return "Rs " + value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function orderStatusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("pend")) return "user-profile-status--pending";
  if (s.includes("cancel") || s.includes("reject")) return "user-profile-status--bad";
  if (s.includes("approv") || s.includes("complet") || s.includes("paid")) return "user-profile-status--ok";
  return "user-profile-status--neutral";
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [ordersPage, setOrdersPage] = useState(0);

  const sortedOrders = useMemo(
    () =>
      [...myOrders].sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
      ),
    [myOrders]
  );

  const orderPageCount = useMemo(
    () => Math.max(0, Math.ceil(sortedOrders.length / ORDERS_PAGE_SIZE)),
    [sortedOrders.length]
  );

  const pagedOrders = useMemo(() => {
    const start = ordersPage * ORDERS_PAGE_SIZE;
    return sortedOrders.slice(start, start + ORDERS_PAGE_SIZE);
  }, [sortedOrders, ordersPage]);

  const rangeFrom =
    sortedOrders.length === 0 ? 0 : ordersPage * ORDERS_PAGE_SIZE + 1;
  const rangeTo = Math.min((ordersPage + 1) * ORDERS_PAGE_SIZE, sortedOrders.length);

  useEffect(() => {
    setOrdersPage((p) => {
      if (sortedOrders.length === 0) return 0;
      const maxP = Math.max(0, Math.ceil(sortedOrders.length / ORDERS_PAGE_SIZE) - 1);
      return p > maxP ? maxP : p;
    });
  }, [sortedOrders.length]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const list = await ordersApi.getByUserId(userId);
        if (!cancelled) setMyOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setMyOrders([]);
          setOrdersError(err?.message || "Could not load your orders.");
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("medix_user");
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }

    let u;
    try {
      u = JSON.parse(raw);
    } catch {
      navigate("/login", { replace: true });
      return;
    }

    if (!u?._id) {
      navigate("/login", { replace: true });
      return;
    }

    if (String(u?.role).toLowerCase() === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    setUserId(u._id);
    setUser(sessionShape(u));
    setForm((prev) => ({
      ...prev,
      fullName: u.fullName || "",
      email: u.email || "",
    }));

    let cancelled = false;
    (async () => {
      try {
        const fresh = await usersApi.getById(u._id);
        if (cancelled) return;
        setUser(fresh);
        setForm((prev) => ({
          ...prev,
          fullName: fresh?.fullName ?? prev.fullName,
          email: fresh?.email ?? prev.email,
        }));
      } catch {
        /* use session data from above */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearMessages();
  };

  const handleStartEdit = () => {
    clearMessages();
    setForm((prev) => ({
      ...prev,
      fullName: user?.fullName || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
    }));
    setEditing(true);
  };

  const handleCancelEdit = () => {
    clearMessages();
    setEditing(false);
    setForm((prev) => ({
      ...prev,
      fullName: user?.fullName || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("Session expired. Please sign in again.");
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload = { fullName: form.fullName, email: form.email };
    if (form.password) payload.password = form.password;

    try {
      setSaving(true);
      clearMessages();
      const response = await usersApi.update(userId, payload);
      const updated = response?.user;
      if (updated) {
        setUser(updated);
        localStorage.setItem("medix_user", JSON.stringify(updated));
      }
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setSuccess("Your profile was updated successfully.");
      setEditing(false);
    } catch (err) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!userId) return;
    const ok = window.confirm(
      "Deactivate your account? This permanently deletes your account and you will need to register again to use Medix."
    );
    if (!ok) return;

    try {
      setDeactivating(true);
      setError("");
      await usersApi.delete(userId);
      localStorage.removeItem("medix_user");
      localStorage.removeItem("medix_token");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Could not deactivate account. Try again later.");
    } finally {
      setDeactivating(false);
    }
  };

  const avatarLetter = (user?.fullName || user?.email || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="user-profile-page">
      <header className="user-profile-hero">
        <p className="user-profile-badge">
          <span className="user-profile-badge-dot" aria-hidden="true" />
          My account
        </p>
        <h1>Profile &amp; security</h1>
        <p>View your details, update your information, or deactivate your account when you no longer need it.</p>
      </header>

      <section className="user-profile-card" aria-busy={loading}>
        {error && (
          <div className="user-profile-alert user-profile-alert--err" role="alert">
            {error}
          </div>
        )}
        {success && !editing && (
          <div className="user-profile-alert user-profile-alert--ok" role="status">
            {success}
          </div>
        )}

        {!editing && (
          <>
            <div className="user-profile-card-head">
              <div className="user-profile-avatar" aria-hidden="true">
                {avatarLetter}
              </div>
              <div className="user-profile-title-block">
                <h2>{loading ? "…" : user?.fullName || "—"}</h2>
                <p className="email">{user?.email || "—"}</p>
              </div>
            </div>

            <div className="user-profile-grid">
              <div className="user-profile-tile">
                <span className="user-profile-dt">Account type</span>
                <p className="user-profile-dd">{user ? displayRole(user.role) : "—"}</p>
              </div>
              <div className="user-profile-tile">
                <span className="user-profile-dt">Member since</span>
                <p className="user-profile-dd">
                  {loading ? <span className="user-profile-skel">Loading…</span> : formatDate(user?.createdAt)}
                </p>
              </div>
            </div>

            <div className="user-profile-actions">
              <button type="button" className="user-profile-btn user-profile-btn--primary" onClick={handleStartEdit}>
                Edit profile
              </button>
              <button
                type="button"
                className="user-profile-btn user-profile-btn--danger"
                onClick={handleDeactivate}
                disabled={deactivating || !userId}
              >
                {deactivating ? "Deactivating…" : "Deactivate account"}
              </button>
            </div>
          </>
        )}

        {editing && (
          <form className="user-profile-form" onSubmit={handleSubmit}>
            {error && (
              <div className="user-profile-alert user-profile-alert--err" role="alert">
                {error}
              </div>
            )}

            <div className="form-row">
              <label htmlFor="up-fullName">Full name</label>
              <input
                id="up-fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="up-email">Email</label>
              <input
                id="up-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row two-col">
              <div>
                <label htmlFor="up-password">New password (optional)</label>
                <input
                  id="up-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="up-confirm">Confirm new password</label>
                <input
                  id="up-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="user-profile-actions">
              <button type="submit" className="user-profile-btn user-profile-btn--primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="user-profile-btn user-profile-btn--ghost"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="user-profile-btn user-profile-btn--danger"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? "Deactivating…" : "Deactivate account"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="user-profile-orders" aria-labelledby="user-profile-orders-title">
        <div className="user-profile-orders-head">
          <h2 id="user-profile-orders-title">My orders</h2>
          <p className="user-profile-orders-sub">Orders you have placed on Medix.</p>
        </div>

        {ordersError && (
          <div className="user-profile-alert user-profile-alert--err user-profile-orders-err" role="alert">
            {ordersError}
          </div>
        )}

        {ordersLoading ? (
          <p className="user-profile-orders-skel" role="status">
            Loading your orders…
          </p>
        ) : ordersError ? null : myOrders.length === 0 ? (
          <div className="user-profile-orders-empty" role="status">
            <div className="user-profile-orders-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="10" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M8 22h48" stroke="currentColor" strokeWidth="2" />
                <path d="M20 36h10M34 36h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="user-profile-orders-empty-title">No orders yet</p>
            <p className="user-profile-orders-empty-text">
              When you purchase medicines, your orders will show up here.
            </p>
            <Link to="/medicines" className="user-profile-btn user-profile-btn--primary user-profile-orders-cta">
              Browse medicines
            </Link>
          </div>
        ) : (
          <>
            <ul className="user-profile-orders-list">
              {pagedOrders.map((o) => (
                <li
                  key={o?._id || String(o?.createdAt) + o?.medicineName}
                  className="user-profile-order"
                >
                  <div className="user-profile-order-top">
                    <h3 className="user-profile-order-medicine">{o?.medicineName || "Medicine"}</h3>
                    <span className={"user-profile-status " + orderStatusClass(o?.status)}>
                      {o?.status || "—"}
                    </span>
                  </div>
                  <div className="user-profile-order-meta">
                    <span>Qty {o?.quantity ?? "—"}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(o?.createdAt)}</span>
                  </div>
                  <div className="user-profile-order-bottom">
                    <span className="user-profile-order-total">{formatRs(o?.totalPrice)}</span>
                    {o?.customerName ? <span className="user-profile-order-name">{o.customerName}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
            {orderPageCount > 1 && (
              <div className="user-profile-orders-pagination" aria-label="Order pages">
                <p className="user-profile-orders-paging-hint">
                  Showing {rangeFrom}–{rangeTo} of {sortedOrders.length} orders
                </p>
                <div className="user-profile-orders-paging-btns">
                  <MedixButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={ordersPage <= 0}
                    onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
                    aria-label="Previous orders page"
                  >
                    Previous
                  </MedixButton>
                  <span className="user-profile-orders-paging-num" aria-hidden="true">
                    Page {ordersPage + 1} / {orderPageCount}
                  </span>
                  <MedixButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={ordersPage >= orderPageCount - 1}
                    onClick={() => setOrdersPage((p) => Math.min(orderPageCount - 1, p + 1))}
                    aria-label="Next orders page"
                  >
                    Next
                  </MedixButton>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}