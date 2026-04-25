import React from "react";
import MedixButton from "./ui/MedixButton";
import "./UserOrderBillingCard.css";

function refShort(id) {
  if (id == null) return "—";
  return String(id).slice(-8).toUpperCase();
}

function formatAmount(value) {
  return `Rs ${(Number(value) || 0).toFixed(2)}`;
}

function formatBillingDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-LK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Invoice summary row: invoice no., order ref, amount, date, and PDF download.
 * Full line items remain on the generated PDF.
 */
export default function UserOrderBillingCard({
  order,
  bill,
  onDownloadInvoice,
  isDownloading = false,
}) {
  const orderRef = refShort(order?._id);

  if (!bill) {
    return (
      <article className="ub-invoice" role="listitem">
        <div className="ub-invoice__empty">
          <p className="ub-invoice__empty-title">No invoice yet</p>
          <p className="ub-invoice__empty-meta">Order no. {orderRef}</p>
          <p className="ub-invoice__empty-text" role="status">
            An invoice will appear here once it has been generated for this order.
          </p>
        </div>
      </article>
    );
  }

  const invoiceNo = refShort(bill._id);
  const amount = formatAmount(bill.total);
  const issued = formatBillingDate(bill.createdAt);

  return (
    <article className="ub-invoice" role="listitem">
      <header className="ub-invoice__header">
        <div>
          <p className="ub-invoice__kicker">Summary</p>
          <h3 className="ub-invoice__title">Invoice</h3>
        </div>
        <MedixButton
          type="button"
          variant="primary"
          size="sm"
          className="ub-invoice__btn"
          onClick={() => onDownloadInvoice(bill)}
          disabled={isDownloading}
        >
          {isDownloading ? "Preparing PDF…" : "Download PDF"}
        </MedixButton>
      </header>
      <div className="ub-invoice__grid" aria-label="Invoice summary">
        <div className="ub-invoice__cell">
          <p className="ub-invoice__label">Invoice no.</p>
          <p className="ub-invoice__value" aria-label={`Invoice number ${invoiceNo}`}>
            {invoiceNo}
          </p>
        </div>
        <div className="ub-invoice__cell">
          <p className="ub-invoice__label">Order no.</p>
          <p className="ub-invoice__value" aria-label={`Order number ${orderRef}`}>
            {orderRef}
          </p>
        </div>
        <div className="ub-invoice__cell">
          <p className="ub-invoice__label">Invoice amount</p>
          <p className="ub-invoice__value ub-invoice__value--amount" aria-label={`Amount ${amount}`}>
            {amount}
          </p>
        </div>
        <div className="ub-invoice__cell">
          <p className="ub-invoice__label">Billing date</p>
          <p className="ub-invoice__value" aria-label={`Billing date ${issued}`}>
            {issued}
          </p>
        </div>
      </div>
      <p className="ub-invoice__footnote">Line items and full payment details are included in the PDF.</p>
    </article>
  );
}               