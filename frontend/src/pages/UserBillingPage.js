import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { billingsApi, ordersApi } from "../api/client";

function formatRs(value) {
  return `Rs ${(Number(value) || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeOrderStatus(value) {
  const status = String(value || "").toLowerCase();
  if (status === "completed") return "Approved";
  if (status === "approved") return "Approved";
  if (status === "cancelled") return "Rejected";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function resolveBillFromOrder(bill, orders) {
  const linkedOrder = orders.find((o) => String(o?._id) === String(bill?.orderId || ""));
  if (!linkedOrder) {
    return {
      medicineName: bill?.medicineName || "-",
      quantity: Number(bill?.quantity || 0),
      price: Number(bill?.price || 0),
      total: Number(bill?.total || 0),
    };
  }

  const quantity = Number(linkedOrder?.quantity || 0);
  const price = Number(linkedOrder?.price || 0);
  const total = Number(linkedOrder?.totalPrice || quantity * price || 0);

  return {
    medicineName: linkedOrder?.medicineName || bill?.medicineName || "-",
    quantity,
    price,
    total,
  };
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("medix_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function UserBillingPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = currentUser?._id ? String(currentUser._id) : "";
  const customerName = currentUser?.fullName || currentUser?.email || "";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ordersData, billsData] = await Promise.all([ordersApi.getAll(), billingsApi.getAll()]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setBills(Array.isArray(billsData) ? billsData : []);
    } catch (err) {
      setError(err.message || "Failed to load billing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?._id) {
      navigate("/login", { replace: true });
      return;
    }
    fetchData();
  }, [currentUser, navigate]);

  const ownApprovedOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderUserId = o?.userId ? String(o.userId) : "";
      const matchesCustomer =
        (currentUserId && orderUserId && orderUserId === currentUserId) ||
        (!orderUserId && String(o?.customerName || "") === customerName);
      const approved = normalizeOrderStatus(o?.status) === "Approved";
      return matchesCustomer && approved;
    });
  }, [orders, currentUserId, customerName]);

  const orderMap = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      map.set(String(o._id), o);
    });
    return map;
  }, [orders]);

  const ownBills = useMemo(() => {
    return bills.filter((b) => {
      const linkedOrder = b?.orderId ? orderMap.get(String(b.orderId)) : null;
      if (linkedOrder) {
        const orderUserId = linkedOrder?.userId ? String(linkedOrder.userId) : "";
        if (currentUserId && orderUserId) {
          return orderUserId === currentUserId;
        }
        return !orderUserId && String(linkedOrder?.customerName || "") === customerName;
      }
      return false;
    });
  }, [bills, currentUserId, customerName, orderMap]);

  const billedOrderIds = useMemo(() => {
    return new Set(
      ownBills
        .map((b) => (b.orderId ? String(b.orderId) : ""))
        .filter(Boolean)
    );
  }, [ownBills]);

  const readyToGenerate = useMemo(() => {
    return ownApprovedOrders.filter((o) => !billedOrderIds.has(String(o._id)));
  }, [ownApprovedOrders, billedOrderIds]);

  const handleGenerateBill = async (order) => {
    try {
      setError("");
      setSuccess("");
      await billingsApi.create({
        orderId: order._id,
        customerName: order.customerName || customerName,
        medicineName: order.medicineName,
        quantity: Number(order.quantity) || 0,
        price: Number(order.price) || 0,
        paymentStatus: "Pending",
      });
      setSuccess("Your bill was generated successfully.");
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to generate your bill.");
    }
  };

  const handleDownloadPdf = async (bill) => {
    const issuedAt = bill?.createdAt ? new Date(bill.createdAt) : new Date();
    const dateText = issuedAt.toLocaleDateString();
    const invoiceNo = String(bill?._id || "").slice(-8).toUpperCase() || "N/A";
    const billData = resolveBillFromOrder(bill, orders);

    const invoice = document.createElement("div");
    invoice.style.position = "fixed";
    invoice.style.left = "-10000px";
    invoice.style.top = "0";
    invoice.style.width = "800px";
    invoice.style.background = "#ffffff";
    invoice.style.padding = "24px";
    invoice.style.fontFamily = "Arial, sans-serif";
    invoice.style.color = "#0f172a";

    invoice.innerHTML = `
      <div style="border:1px solid #cbd5e1; border-radius:12px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0f3b5f,#0d9488); color:#fff; padding:18px 20px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h1 style="margin:0; font-size:28px; letter-spacing:0.2px;">Medix Pharmacy</h1>
          </div>
          <div style="text-align:right; font-size:13px; line-height:1.6;">
            <div><strong>Bill ID:</strong> ${escapeHtml(invoiceNo)}</div>
            <div><strong>Date:</strong> ${escapeHtml(dateText)}</div>
          </div>
        </div>

        <div style="padding:18px 20px 8px;">
          <p style="margin:0 0 8px;"><strong>Customer name:</strong> ${escapeHtml(bill?.customerName || customerName || "Walk-in")}</p>
        </div>

        <div style="padding:0 20px 18px;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="border:1px solid #cbd5e1; padding:10px; text-align:left;">Medicine name</th>
                <th style="border:1px solid #cbd5e1; padding:10px; text-align:left;">Quantity</th>
                <th style="border:1px solid #cbd5e1; padding:10px; text-align:left;">Price</th>
                <th style="border:1px solid #cbd5e1; padding:10px; text-align:left;">Total amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #cbd5e1; padding:10px;">${escapeHtml(billData.medicineName)}</td>
                <td style="border:1px solid #cbd5e1; padding:10px;">${escapeHtml(billData.quantity)}</td>
                <td style="border:1px solid #cbd5e1; padding:10px;">${escapeHtml(formatRs(billData.price))}</td>
                <td style="border:1px solid #cbd5e1; padding:10px; font-weight:700;">${escapeHtml(formatRs(billData.total))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="border-top:1px solid #e2e8f0; background:#f8fafc; padding:14px 20px; font-size:13px; color:#475569; text-align:center;">
          Thank you for your purchase
        </div>
      </div>
    `;

    document.body.appendChild(invoice);

    try {
      const canvas = await html2canvas(invoice, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 8;
      const width = pdfWidth - margin * 2;
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(image, "PNG", margin, margin, width, height);
      pdf.save(`Medix_Bill_${invoiceNo}.pdf`);
    } catch (err) {
      setError(err.message || "Failed to generate bill PDF.");
    } finally {
      document.body.removeChild(invoice);
    }
  };

  return (
    <div className="public-main">
      <section className="public-hero-card cart-shell">
        <div className="inventory-head">
          <div>
            <p className="public-kicker">My Billing</p>
            <h1 className="public-title inventory-title">Your Bills</h1>
            <p className="public-subtitle">Generate bill for approved orders and download your invoice PDF.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card table-card">
          <h2>Approved Orders Ready For Bill</h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : readyToGenerate.length === 0 ? (
            <p className="empty">No approved orders ready for bill generation.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readyToGenerate.map((o) => (
                    <tr key={o._id}>
                      <td>{o.medicineName}</td>
                      <td>{o.quantity}</td>
                      <td>{formatRs(o.price)}</td>
                      <td>{formatRs(o.totalPrice)}</td>
                      <td>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleGenerateBill(o)}>
                          Generate Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card table-card">
          <h2>My Generated Bills</h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : ownBills.length === 0 ? (
            <p className="empty">You do not have any bills yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill ID</th>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ownBills.map((b) => (
                    <tr key={b._id}>
                      <td>{String(b._id).slice(-8).toUpperCase()}</td>
                      <td>{b.medicineName}</td>
                      <td>{b.quantity}</td>
                      <td>{formatRs(b.total)}</td>
                      <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}</td>
                      <td>
                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleDownloadPdf(b)}>
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
