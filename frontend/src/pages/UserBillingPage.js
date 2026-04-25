import React, { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { billingsApi, ordersApi } from "../api/client";
import MedixPublicHero from "../components/MedixPublicHero";
import MedixButton from "../components/ui/MedixButton";
import UserOrderBillingCard from "../components/UserOrderBillingCard";
import billingHeroImage from "../images/young-hispanic-man-pharmacist-smiling-confident-scanning-pills-bottle-pharmacy.jpg";
import "./UserBillingPage.css";

function formatRs(value) {
  return `Rs ${(Number(value) || 0).toFixed(2)}`;
}

function resolveBillFromOrder(bill, orderList) {
  const linkedOrder = orderList.find((o) => String(o?._id) === String(bill?.orderId || ""));
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

function isBillPaid(bill) {
  return String(bill?.paymentStatus || "").toLowerCase() === "paid";
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/** Latest billing row in the system for this order (if any). */
function getLatestBillForOrder(orderId, allBills) {
  if (orderId == null) return null;
  const list = allBills.filter((b) => String(b?.orderId) === String(orderId));
  if (list.length === 0) return null;
  return list.sort(
    (a, b) =>
      new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0)
  )[0];
}

function orderBelongsToUser(o, currentUserId, customerName) {
  const orderUserId = o?.userId ? String(o.userId) : "";
  if (currentUserId && orderUserId) {
    return orderUserId === currentUserId;
  }
  return !orderUserId && String(o?.customerName || "") === String(customerName || "");
}

export default function UserBillingPage() {
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const isLoggedIn = Boolean(currentUser?._id || currentUser?.email);

  const syncUser = useCallback(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    window.addEventListener("focus", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("focus", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [syncUser]);

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
      setError(err.message || "Failed to load orders and billing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      setOrders([]);
      setBills([]);
      return;
    }
    fetchData();
  }, [isLoggedIn]);

  const myOrders = useMemo(() => {
    return orders
      .filter((o) => orderBelongsToUser(o, currentUserId, customerName))
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [orders, currentUserId, customerName]);

  const downloadInvoicePdf = (bill) => {
    if (!bill?._id) return;

    const paid = isBillPaid(bill);
    const billData = resolveBillFromOrder(bill, orders);
    const linkedOrder = bill?.orderId
      ? orders.find((o) => String(o?._id) === String(bill.orderId))
      : null;
    const invoiceNo = String(bill._id).slice(-8).toUpperCase() || "N/A";
    const orderRef = linkedOrder?._id
      ? String(linkedOrder._id).slice(-8).toUpperCase()
      : "—";
    const issued = bill?.createdAt ? new Date(bill.createdAt) : new Date();
    const dateText = issued.toLocaleDateString("en-LK", { dateStyle: "long" });
    const orderPlacedAt = linkedOrder?.createdAt ? formatDateTime(linkedOrder.createdAt) : "—";
    const paymentAt = paid
      ? (bill?.updatedAt ? formatDateTime(bill.updatedAt) : formatDateTime(bill?.createdAt))
      : "—";
    const amountNum = Number(billData.total) || Number(bill?.total) || 0;
    const orderStatusLabel = linkedOrder?.status ? String(linkedOrder.status) : "—";
    const cust = bill?.customerName || customerName || "Customer";

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const m = 16;
    const maxText = w - m * 2;
    let y = 18;
    const line = (t, weight = "normal", size = 10) => {
      doc.setFont("helvetica", weight);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(t, maxText);
      doc.text(lines, m, y);
      y += lines.length * 5.2;
    };

    doc.setDrawColor(15, 59, 95);
    doc.setLineWidth(0.5);
    doc.line(m, y, w - m, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 59, 95);
    doc.text("Medix Pharmacy", m, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    line(paid ? "TAX INVOICE" : "INVOICE (payment not completed)", "bold", 11);
    y += 2;
    doc.setTextColor(0, 0, 0);
    line(`Invoice no. ${invoiceNo}    Date: ${dateText}`);

    y += 3;
    line("Bill to: " + cust, "normal");
    y += 4;
    line("— Order —", "bold", 10);
    line(`Order #${orderRef}`);
    line(`Status: ${orderStatusLabel}   Placed: ${orderPlacedAt}`);

    y += 2;
    line("— Payment —", "bold", 10);
    line(`Status: ${paid ? "PAID" : (bill?.paymentStatus || "Pending")}`);
    line(`Amount: ${formatRs(amountNum)}`);
    if (paid) {
      line(`Payment recorded: ${paymentAt}`);
    }

    y += 2;
    line("— Line item (billing) —", "bold", 10);
    const itemName = String(billData.medicineName || "—");
    const itemLines = doc.splitTextToSize("Item: " + itemName, maxText);
    doc.text(itemLines, m, y);
    y += itemLines.length * 5.2;
    line(
      `Qty: ${billData.quantity}   Unit: ${formatRs(billData.price)}   Line total: ${formatRs(
        billData.total
      )}`,
      "bold",
      10
    );

    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(m, y, w - m, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total: " + formatRs(amountNum), w - m, y, { align: "right" });
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Medix Pharmacy — electronic invoice", w / 2, y, { align: "center" });

    doc.save(`Medix_Invoice_${invoiceNo}.pdf`);
  };

  const handleDownloadInvoice = async (bill) => {
    if (!bill) return;
    setError("");
    setDownloadingId(String(bill._id));
    try {
      await new Promise((r) => {
        setTimeout(r, 0);
      });
      downloadInvoicePdf(bill);
    } catch (err) {
      setError(err?.message || "Could not create the PDF. Try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="public-main">
      <MedixPublicHero
        kicker="Billing"
        title="Billing details for your orders"
        subtitle="When an invoice exists, each row shows the invoice and order numbers, amount, and billing date; the PDF includes full line items and payment details."
        image={billingHeroImage}
        imageAlt="Pharmacist at the counter preparing medicine"
        className="cart-shell"
      />

        {!isLoggedIn ? (
          <div className="medix-guest-prompt" role="status">
            <p className="medix-guest-emoji" aria-hidden="true">
              📋
            </p>
            <h2>Sign in to view billing</h2>
            <p>Sign in to see billing information for your orders.</p>
            <div className="medix-guest-prompt__actions">
              <MedixButton to="/login" state={{ from: "/billing" }} variant="primary">
                Sign in
              </MedixButton>
              <MedixButton to="/signup" variant="ghost">
                Create account
              </MedixButton>
            </div>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
              <p className="loading">Loading billing…</p>
            ) : myOrders.length === 0 ? (
              <p className="empty">You have no orders yet. After you place orders, you will see billing details here.</p>
            ) : (
              <div className="ub-billing" role="list">
                {myOrders.map((o) => {
                  const bill = getLatestBillForOrder(o._id, bills);
                  return (
                    <UserOrderBillingCard
                      key={o._id}
                      order={o}
                      bill={bill}
                      onDownloadInvoice={handleDownloadInvoice}
                      isDownloading={!!bill && downloadingId === String(bill._id)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
    </div>
  );
}