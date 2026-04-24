import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { billingsApi, ordersApi } from "../api/client";
import AdminPageShell from "../components/AdminPageShell";

function formatRs(amount) {
  const value = Number(amount) || 0;
  return "Rs " + value.toFixed(2);
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function normalizePaymentStatus(status) {
  const s = String(status || "Pending").trim();
  if (!s) return "Pending";
  const lower = s.toLowerCase();
  if (lower === "paid") return "Paid";
  if (lower === "pending") return "Pending";
  return s;
}

function paymentBadgeClass(status) {
  const s = normalizePaymentStatus(status).toLowerCase();
  if (s === "paid") return "badge badge-paid";
  return "badge badge-pending";
}

function isValidObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
}

function polarToCartesian(cx, cy, r, angleDegrees) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRadians),
    y: cy + r * Math.sin(angleRadians),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "L", cx, cy, "Z"].join(" ");
}

function PieChart({ data }) {
  const size = 180;
  const radius = 78;
  const cx = size / 2;
  const cy = size / 2;

  const cleanData = (Array.isArray(data) ? data : []).filter((s) => Number(s?.value || 0) > 0);
  const total = cleanData.reduce((sum, s) => sum + Number(s.value || 0), 0);
  if (!total) {
    return <p className="empty">No data for pie chart.</p>;
  }

  const colors = ["var(--success)", "var(--warning)", "var(--primary)", "var(--secondary)", "var(--danger)", "var(--accent)"];

  if (cleanData.length === 1) {
    const slice = cleanData[0];
    const color = colors[0];
    return (
      <div className="chart-pie">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
          <circle cx={cx} cy={cy} r={radius} style={{ fill: color }} />
        </svg>

        <div className="chart-legend">
          <div className="legend-row">
            <span className="legend-dot" style={{ background: color }} aria-hidden="true" />
            <span className="legend-name">{slice.name}</span>
            <span className="legend-value">100.0%</span>
          </div>
        </div>
      </div>
    );
  }

  let currentAngle = 0;
  const slices = cleanData.map((slice, idx) => {
    const value = Number(slice.value || 0);
    const angle = (value / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    return {
      ...slice,
      path: describeArc(cx, cy, radius, start, end),
      color: colors[idx % colors.length],
      percent: (value / total) * 100,
    };
  });

  return (
    <div className="chart-pie">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
        {slices.map((s) => (
          <path key={s.name} d={s.path} style={{ fill: s.color }} />
        ))}
      </svg>

      <div className="chart-legend">
        {slices.map((s) => (
          <div key={s.name} className="legend-row">
            <span className="legend-dot" style={{ background: s.color }} aria-hidden="true" />
            <span className="legend-name">{s.name}</span>
            <span className="legend-value">{s.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const list = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...list.map((d) => Number(d.value || 0)));
  if (!list.length) {
    return <p className="empty">No data for bar chart.</p>;
  }
  return (
    <div className="chart-bars">
      {list.map((d) => {
        const value = Number(d.value || 0);
        const pct = Math.max(0, Math.min(100, (value / max) * 100));
        return (
          <div key={d.name} className="bar-row">
            <div className="bar-label" title={d.name}>
              {d.name}
            </div>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="bar-value">{formatRs(value)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function BillingPage() {
  const chartsRef = useRef(null);
  const formRef = useRef(null);
  const [billings, setBillings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingCharts, setDownloadingCharts] = useState(false);
  const [downloadingSummary, setDownloadingSummary] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({
    paymentStatus: "Pending",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const [billingsData, ordersData] = await Promise.all([
        billingsApi.getAll(),
        ordersApi.getAll(),
      ]);
      
      const billingsList = Array.isArray(billingsData) ? billingsData : [];
      billingsList.sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });
      setBillings(billingsList);
      
      const ordersList = Array.isArray(ordersData) ? ordersData : [];
      setOrders(ordersList);
    } catch (err) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      console.log("Form should be visible and scrolled into view");
    }
  }, [showForm]);

  const computedTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    const price = Number(selectedOrder.price || 0);
    const qty = Number(selectedOrder.quantity || 0);
    const total = qty * price;
    if (!Number.isFinite(total)) return 0;
    return Number(total.toFixed(2));
  }, [selectedOrder]);

  // Get list of orders that are not yet billed
  const readyToBillOrders = useMemo(() => {
    const ordersList = Array.isArray(orders) ? orders : [];
    const billingsList = Array.isArray(billings) ? billings : [];
    
    // Get all order IDs that already have bills
    const billedOrderIds = new Set();
    for (const bill of billingsList) {
      if (bill?.orderId) {
        billedOrderIds.add(String(bill.orderId));
      }
    }
    
    // Filter orders by status "Approved" and not yet billed
    return ordersList
      .filter((order) => {
        const status = String(order?.status || "").trim();
        const orderId = String(order?._id || "");
        return status === "Approved" && !billedOrderIds.has(orderId);
      })
      .sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });
  }, [orders, billings]);

  const stats = useMemo(() => {
    const list = Array.isArray(billings) ? billings : [];
    const total = list.length;
    let pending = 0;
    let paid = 0;
    let paidRevenue = 0;
    let pendingTotal = 0;

    for (const b of list) {
      const status = normalizePaymentStatus(b?.paymentStatus).toLowerCase();
      const value = Number(b?.total || 0);
      if (status === "paid") {
        paid += 1;
        paidRevenue += Number.isFinite(value) ? value : 0;
      } else {
        pending += 1;
        pendingTotal += Number.isFinite(value) ? value : 0;
      }
    }

    return {
      total,
      pending,
      paid,
      paidRevenue: Number(paidRevenue.toFixed(2)),
      outstanding: Number(pendingTotal.toFixed(2)),
    };
  }, [billings]);

  const orderSummary = useMemo(() => {
    const list = Array.isArray(billings) ? billings : [];
    let subtotal = 0;
    
    for (const b of list) {
      const value = Number(b?.total || 0);
      if (Number.isFinite(value)) {
        subtotal += value;
      }
    }
    
    const tax = subtotal * 0.05; // 5% tax
    const delivery = list.length > 0 ? 100 * list.length : 0; // 100 per bill
    const finalTotal = subtotal + tax + delivery;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      delivery: Number(delivery.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
    };
  }, [billings]);

  const charts = useMemo(() => {
    const list = Array.isArray(billings) ? billings : [];
    let pending = 0;
    let paid = 0;
    const revenueByMedicine = new Map();

    for (const b of list) {
      const status = normalizePaymentStatus(b?.paymentStatus).toLowerCase();
      if (status === "paid") {
        paid += 1;
        const name = String(b?.medicineName || "Unknown").trim() || "Unknown";
        const value = Number(b?.total || 0);
        revenueByMedicine.set(name, (revenueByMedicine.get(name) || 0) + (Number.isFinite(value) ? value : 0));
      } else {
        pending += 1;
      }
    }

    const paymentData = [
      { name: "Paid", value: paid },
      { name: "Pending", value: pending },
    ];

    const topMedicinesByRevenue = Array.from(revenueByMedicine.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    return { paymentData, topMedicinesByRevenue };
  }, [billings]);

  const resetForm = () => {
    setForm({
      paymentStatus: "Pending",
    });
    setSelectedOrder(null);
    setEditing(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setEditing(null);
    setSelectedOrder(null);
    setForm({
      paymentStatus: "Pending",
    });
    setShowForm(true);
  };

  const openEditForm = (bill) => {
    console.log("Edit button clicked, bill:", bill);
    if (!bill?._id) {
      console.log("Bill ID missing, returning");
      return;
    }
    setError("");
    setSuccess("");
    setEditing(bill);
    setSelectedOrder(null);
    setForm({
      paymentStatus: normalizePaymentStatus(bill?.paymentStatus),
    });
    setShowForm(true);
    console.log("Form should now be visible");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
  };

  const submitBilling = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      // For new billing, must select an order
      if (!editing && !selectedOrder) {
        throw new Error("Please select an order to create a bill.");
      }

      if (editing) {
        // For editing, only update payment status
        const paymentStatus = normalizePaymentStatus(form.paymentStatus);
        const payload = {
          orderId: editing?.orderId ?? null,
          customerName: editing?.customerName,
          medicineName: editing?.medicineName,
          quantity: Number(editing?.quantity || 0),
          price: Number(editing?.price || 0),
          total: Number(editing?.total || 0),
          paymentStatus,
        };
        await billingsApi.update(editing._id, payload);
        setSuccess("Billing updated.");
      } else {
        // For new billing, create from selected order
        const orderId = String(selectedOrder._id || "");
        const customerName = String(selectedOrder?.customerName || "Walk-in").trim() || "Walk-in";
        const medicineName = String(selectedOrder?.medicineName || "").trim();
        const qty = Number(selectedOrder?.quantity || 1);
        const price = Number(selectedOrder?.price || 0);
        const total = Number(selectedOrder?.totalPrice || qty * price);

        if (!medicineName) throw new Error("Order medicine name is invalid.");
        if (qty <= 0) throw new Error("Order quantity must be at least 1.");
        if (!Number.isFinite(price)) throw new Error("Order price is invalid.");

        const payload = {
          orderId,
          customerName,
          medicineName,
          quantity: qty,
          price,
          total,
          paymentStatus: normalizePaymentStatus(form.paymentStatus),
        };

        await billingsApi.create(payload);
        setSuccess("Bill created from order.");
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to save billing.");
    } finally {
      setSubmitting(false);
    }
  };

  const setPaymentStatus = async (bill, nextStatus) => {
    const id = String(bill?._id || "");
    if (!id) return;
    try {
      setSavingId(id);
      setError("");
      setSuccess("");

      if (normalizePaymentStatus(nextStatus) === "Paid") {
        await billingsApi.markPaid(id);
      } else {
        await billingsApi.update(id, {
          orderId: bill?.orderId ?? null,
          customerName: bill?.customerName,
          medicineName: bill?.medicineName,
          quantity: Number(bill?.quantity || 0),
          price: Number(bill?.price || 0),
          total: Number(bill?.total || 0),
          paymentStatus: "Pending",
        });
      }

      setSuccess(`Payment status updated to ${normalizePaymentStatus(nextStatus)}.`);
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to update billing.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteBilling = async (bill) => {
    const id = String(bill?._id || "");
    if (!id) return;
    if (!window.confirm("Delete this billing record? This cannot be undone.")) return;
    try {
      setSavingId(id);
      setError("");
      setSuccess("");
      await billingsApi.delete(id);
      setSuccess("Billing deleted.");
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to delete billing.");
    } finally {
      setSavingId(null);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadCharts = async () => {
    const node = chartsRef.current;
    if (!node) {
      setError("Charts section not found.");
      return;
    }
    try {
      setDownloadingCharts(true);
      setError("");
      setSuccess("");
      const canvas = await html2canvas(node, { scale: 2, useCORS: true });
      await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to export chart image."));
            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
            downloadBlob(blob, `billing-charts-${stamp}.png`);
            resolve();
          },
          "image/png",
          1
        );
      });
      setSuccess("Charts downloaded.");
    } catch (err) {
      setError(err.message || "Failed to download charts.");
    } finally {
      setDownloadingCharts(false);
    }
  };

  const csvValue = (value) => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const downloadSummaryReport = async () => {
    try {
      setDownloadingSummary(true);
      setError("");
      setSuccess("");

      const generatedAt = new Date().toISOString();
      const lines = [];
      lines.push(["Medix Billing Summary Report"].map(csvValue).join(","));
      lines.push(["Generated At", generatedAt].map(csvValue).join(","));
      lines.push("");
      lines.push(["Metric", "Value"].map(csvValue).join(","));
      lines.push(["Total Bills", stats.total].map(csvValue).join(","));
      lines.push(["Pending", stats.pending].map(csvValue).join(","));
      lines.push(["Paid", stats.paid].map(csvValue).join(","));
      lines.push(["Paid Revenue", Number(stats.paidRevenue || 0).toFixed(2)].map(csvValue).join(","));
      lines.push(["Outstanding", Number(stats.outstanding || 0).toFixed(2)].map(csvValue).join(","));
      lines.push("");
      lines.push(["Payment Status", "Count"].map(csvValue).join(","));
      for (const row of charts.paymentData) {
        lines.push([row.name, row.value].map(csvValue).join(","));
      }
      lines.push("");
      lines.push(["Top Medicines (Paid Revenue)", "Revenue"].map(csvValue).join(","));
      if (charts.topMedicinesByRevenue.length === 0) {
        lines.push(["(none)", "0.00"].map(csvValue).join(","));
      } else {
        for (const row of charts.topMedicinesByRevenue) {
          lines.push([row.name, Number(row.value || 0).toFixed(2)].map(csvValue).join(","));
        }
      }

      const csv = lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadBlob(blob, `billing-summary-${stamp}.csv`);
      setSuccess("Summary report downloaded.");
    } catch (err) {
      setError(err.message || "Failed to download summary report.");
    } finally {
      setDownloadingSummary(false);
    }
  };

  return (
    <AdminPageShell breadcrumb="Billing">
      <div className="billing-page ph-admin-billing">
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p className="page-subtitle">Create bills from approved orders and track payment status.</p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={downloadCharts}
            disabled={loading || downloadingCharts}
          >
            {downloadingCharts ? "Downloading..." : "Download Charts"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={downloadSummaryReport}
            disabled={loading || downloadingSummary}
          >
            {downloadingSummary ? "Downloading..." : "Download Summary"}
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreateForm} disabled={loading || readyToBillOrders.length === 0}>
            Create Bill from Order
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card form-card" ref={formRef}>
          <h2>{editing ? "Update Bill Payment Status" : "Create Bill from Order"}</h2>
          
          {!editing && (
            <div className="orders-selection">
              <h3>Select Order</h3>
              {readyToBillOrders.length === 0 ? (
                <div className="empty">No orders available to bill.</div>
              ) : (
                <div className="orders-list">
                  {readyToBillOrders.map((order) => {
                    const isSelected = selectedOrder?._id === order._id;
                    return (
                      <div
                        key={String(order._id)}
                        className={`order-card ${isSelected ? "selected" : ""}`}
                        onClick={() => handleOrderSelect(order)}
                        style={{
                          padding: "1rem",
                          border: isSelected ? "2px solid #0284c7" : "1px solid #d1d5db",
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#e0f2fe" : "#fff",
                          marginBottom: "0.75rem",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                          <strong>{order?.medicineName || "Unknown"}</strong>
                          <span style={{ fontSize: "0.9rem", color: "#666" }}>
                            {new Date(order?.createdAt || 0).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "2rem", fontSize: "0.9rem", color: "#666" }}>
                          <span>Qty: {order?.quantity || 0}</span>
                          <span>Price: Rs {(order?.price || 0).toFixed(2)}</span>
                          <span>Total: Rs {(order?.totalPrice || 0).toFixed(2)}</span>
                          <span>Customer: {order?.customerName || "Unknown"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <form onSubmit={submitBilling} style={{ marginTop: editing ? "0" : "2rem" }}>
            {editing && (
              <div className="selected-order-info" style={{ 
                marginBottom: "1.5rem", 
                padding: "1rem", 
                backgroundColor: "#fef3c7", 
                borderRadius: "8px",
                border: "1px solid #f59e0b"
              }}>
                <h4 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Bill Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.95rem" }}>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Medicine:</span> {editing?.medicineName}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Customer:</span> {editing?.customerName}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Quantity:</span> {editing?.quantity}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Unit Price:</span> Rs {(editing?.price || 0).toFixed(2)}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Total:</span> Rs {(editing?.total || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {!editing && selectedOrder && (
              <div className="selected-order-info" style={{ 
                marginBottom: "1.5rem", 
                padding: "1rem", 
                backgroundColor: "#e0f2fe",
                borderRadius: "8px",
                border: "1px solid #0284c7"
              }}>
                <h4 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Selected Order Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.95rem" }}>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Medicine:</span> {selectedOrder?.medicineName}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Customer:</span> {selectedOrder?.customerName}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Quantity:</span> {selectedOrder?.quantity}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Unit Price:</span> Rs {(selectedOrder?.price || 0).toFixed(2)}
                  </div>
                  <div>
                    <span style={{ color: "#666", fontWeight: 500 }}>Total:</span> Rs {(selectedOrder?.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <div className="form-row">
              <label htmlFor="paymentStatus">Payment Status</label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={handleFormChange}
                disabled={submitting}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting || (!editing && !selectedOrder)}>
                {submitting ? "Saving..." : editing ? "Update Payment Status" : "Create Bill"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Summary</h2>
        <div className="analysis-grid">
          <div className="analysis-stat stat-total">
            <div className="analysis-value">{stats.total}</div>
            <div className="analysis-label">Total Bills</div>
          </div>
          <div className="analysis-stat stat-pending">
            <div className="analysis-value">{stats.pending}</div>
            <div className="analysis-label">Pending</div>
          </div>
          <div className="analysis-stat stat-paid">
            <div className="analysis-value">{stats.paid}</div>
            <div className="analysis-label">Paid</div>
          </div>
          <div className="analysis-stat stat-revenue">
            <div className="analysis-value">{formatRs(stats.paidRevenue)}</div>
            <div className="analysis-label">Paid Revenue</div>
          </div>
          <div className="analysis-stat stat-outstanding">
            <div className="analysis-value">{formatRs(stats.outstanding)}</div>
            <div className="analysis-label">Outstanding</div>
          </div>
        </div>
      </div>

      <div className="card order-summary-card">
        <h2 className="order-summary-title">Order Summary</h2>
        
        <div className="order-summary-content">
          <div className="summary-row">
            <span className="summary-label">Subtotal ({stats.total} bills)</span>
            <span className="summary-value">{formatRs(orderSummary.subtotal)}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Tax (5%)</span>
            <span className="summary-value">{formatRs(orderSummary.tax)}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Delivery Fee</span>
            <span className="summary-value">{formatRs(orderSummary.delivery)}</span>
          </div>

          <div className="summary-row summary-total">
            <span className="summary-label">Total</span>
            <span className="summary-total-value">{formatRs(orderSummary.total)}</span>
          </div>
        </div>
      </div>

      <div className="card" ref={chartsRef}>
        <h2>Charts</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">Payment Status Distribution</h3>
            <PieChart data={charts.paymentData} />
          </div>
          <div className="chart-card">
            <h3 className="chart-title">Top Medicines (Paid Revenue)</h3>
            <BarChart data={charts.topMedicinesByRevenue} />
          </div>
        </div>
      </div>

      <div className="card table-card">
        <h2>All Bills</h2>
        {loading ? (
          <div className="loading">Loading bills...</div>
        ) : billings.length === 0 ? (
          <div className="empty">No bills found.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Medicine</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {billings.map((bill) => {
                  const id = String(bill?._id || "");
                  const status = normalizePaymentStatus(bill?.paymentStatus);
                  const isSaving = savingId === id;
                  return (
                    <tr key={id}>
                      <td>{bill?.customerName || "Walk-in"}</td>
                      <td>{bill?.medicineName || "-"}</td>
                      <td>{Number(bill?.quantity || 0)}</td>
                      <td>{formatRs(bill?.price)}</td>
                      <td>{formatRs(bill?.total)}</td>
                      <td>
                        <span className={paymentBadgeClass(status)}>{status}</span>
                      </td>
                      <td>{formatDateTime(bill?.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("Edit clicked for bill:", bill?._id);
                              openEditForm(bill);
                            }}
                            disabled={isSaving}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => setPaymentStatus(bill, "Paid")}
                            disabled={isSaving || normalizePaymentStatus(bill?.paymentStatus) === "Paid"}
                          >
                            Mark Paid
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setPaymentStatus(bill, "Pending")}
                            disabled={isSaving || normalizePaymentStatus(bill?.paymentStatus) === "Pending"}
                          >
                            Set Pending
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => deleteBilling(bill)}
                            disabled={isSaving}
                          >
                            Delete
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