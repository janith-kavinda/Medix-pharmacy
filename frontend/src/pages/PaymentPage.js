import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { billingsApi, medicinesApi, ordersApi } from "../api/client";
import MedixButton from "../components/ui/MedixButton";

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCardNumber(digits) {
  const d = onlyDigits(digits).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateEmailOptional(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  // Simple email check (optional field)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? "" : "Enter a valid email address.";
}

function validateCardOptional(digits) {
  const d = onlyDigits(digits);
  if (!d) return "";
  if (d.length !== 16) return "Card number must be 16 digits.";
  return "";
}

function validateCvvOptional(digits) {
  const d = onlyDigits(digits);
  if (!d) return "";
  if (d.length !== 3) return "CVV must be 3 digits.";
  return "";
}

function validateExpiryOptional(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  if (!/^\d{2}\/\d{2}$/.test(s)) return "Expiry must be in MM/YY format.";
  const [mmText] = s.split("/");
  const mm = Number(mmText);
  if (mm < 1 || mm > 12) return "Expiry month must be between 01 and 12.";
  return "";
}

function validatePaymentRequired(payment) {
  const paypalEmail = String(payment?.paypalEmail || "").trim();
  const cardNumberDigits = onlyDigits(payment?.cardNumberDigits).trim();
  const expiry = String(payment?.expiry || "").trim();
  const cvvDigits = onlyDigits(payment?.cvvDigits).trim();

  const wantsPaypal = Boolean(paypalEmail);
  const wantsCard = Boolean(cardNumberDigits || expiry || cvvDigits);

  if (!wantsPaypal && !wantsCard) {
    return {
      form: "Please enter PayPal email or fill in credit card details.",
      paypalEmail: "",
      cardNumberDigits: "Card number is required.",
      expiry: "Expiry date is required.",
      cvvDigits: "CVV is required.",
    };
  }

  if (wantsPaypal) {
    return {
      form: "",
      paypalEmail: validateEmailOptional(paypalEmail),
      cardNumberDigits: "",
      expiry: "",
      cvvDigits: "",
    };
  }

  // Card flow: require all card fields.
  return {
    form: "",
    paypalEmail: "",
    cardNumberDigits: cardNumberDigits ? validateCardOptional(cardNumberDigits) : "Card number is required.",
    expiry: expiry ? validateExpiryOptional(expiry) : "Expiry date is required.",
    cvvDigits: cvvDigits ? validateCvvOptional(cvvDigits) : "CVV is required.",
  };
}

function getCartId(item) {
  return String(item?._id || item?.id || item?.name || "");
}

function normalizeCartList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      _id: item?._id || item?.id || item?.medicineId || item?.name,
      name: item?.name || item?.medicineName || "Unknown Medicine",
      price: Number(item?.price || 0),
      manufacturer: item?.manufacturer || "",
      quantity: Math.max(1, Number(item?.quantity || 1)),
    }))
    .filter((item) => Boolean(getCartId(item)));
}

function getStoredCart() {
  try {
    const rawPrimary = localStorage.getItem("medix_selected_medicines");
    const rawLegacy = localStorage.getItem("medix_cart");
    const primary = rawPrimary ? JSON.parse(rawPrimary) : [];
    const legacy = rawLegacy ? JSON.parse(rawLegacy) : [];
    const normalizedPrimary = normalizeCartList(primary);
    if (normalizedPrimary.length > 0) return normalizedPrimary;
    return normalizeCartList(legacy);
  } catch {
    return [];
  }
}

function clearStoredCart() {
  localStorage.setItem("medix_selected_medicines", JSON.stringify([]));
  localStorage.setItem("medix_cart", JSON.stringify([]));
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => getStoredCart());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payment, setPayment] = useState({
    paypalEmail: "",
    cardNumberDigits: "",
    expiry: "",
    cvvDigits: "",
  });
  const [touched, setTouched] = useState({
    paypalEmail: false,
    cardNumberDigits: false,
    expiry: false,
    cvvDigits: false,
  });

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [items]);

  const paymentErrors = useMemo(() => {
    return validatePaymentRequired(payment);
  }, [payment]);

  const paymentHasErrors = useMemo(() => {
    return Object.entries(paymentErrors)
      .filter(([key]) => key !== "form")
      .some(([, value]) => Boolean(value));
  }, [paymentErrors]);

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const payNow = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!items.length) {
        throw new Error("Your cart is empty.");
      }

      // Require either PayPal email OR complete valid card details.
      const gateErrors = validatePaymentRequired(payment);
      const hasGateErrors =
        Boolean(gateErrors.form) ||
        Object.entries(gateErrors)
          .filter(([key]) => key !== "form")
          .some(([, value]) => Boolean(value));

      if (hasGateErrors) {
        setTouched({
          paypalEmail: true,
          cardNumberDigits: true,
          expiry: true,
          cvvDigits: true,
        });
        throw new Error(gateErrors.form || "Please fix the payment form inputs.");
      }

      const userRaw = localStorage.getItem("medix_user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?._id || null;
      const customerName = user?.fullName || user?.email || "Customer";

      if (!userId) {
        throw new Error("Please login again before placing an order.");
      }

      const medicines = await medicinesApi.getAll();
      const medicineMap = new Map();

      (Array.isArray(medicines) ? medicines : []).forEach((med) => {
        const keyById = String(med?._id || "");
        const keyByName = String(med?.name || "").toLowerCase();
        if (keyById) medicineMap.set(keyById, med);
        if (keyByName) medicineMap.set(keyByName, med);
      });

      for (const item of items) {
        const keyById = String(item?._id || "");
        const keyByName = String(item?.name || "").toLowerCase();
        const med = medicineMap.get(keyById) || medicineMap.get(keyByName);
        if (!med) {
          throw new Error(`Medicine not found: ${item.name}`);
        }
        const stock = Number(med.quantity || 0);
        const qty = Number(item.quantity || 1);
        if (qty > stock) {
          throw new Error(`Not enough stock for ${item.name}. Available: ${stock}`);
        }
      }

      const createdOrders = await Promise.all(
        items.map((item) => {
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || 0);
          return ordersApi.create({
            userId,
            customerName,
            medicineName: item.name,
            quantity: qty,
            price,
            totalPrice: Number((qty * price).toFixed(2)),
            status: "Approved",
          });
        })
      );

      await Promise.all(
        createdOrders.map((order) =>
          billingsApi.create({
            orderId: String(order._id),
            customerName: String(order.customerName || customerName),
            medicineName: String(order.medicineName),
            quantity: Number(order.quantity),
            price: Number(order.price),
            paymentStatus: "Paid",
          })
        )
      );

      await Promise.all(
        items.map((item) => {
          const keyById = String(item?._id || "");
          const keyByName = String(item?.name || "").toLowerCase();
          const med = medicineMap.get(keyById) || medicineMap.get(keyByName);
          const qty = Number(item.quantity || 1);
          const nextQty = Math.max(0, Number(med?.quantity || 0) - qty);

          return medicinesApi.update(med._id, {
            name: med.name,
            manufacturer: med.manufacturer || "",
            price: Number(med.price || 0),
            quantity: nextQty,
            expiryDate: med.expiryDate,
            description: med.description || "",
          });
        })
      );

      clearStoredCart();
      setItems([]);
      setSuccess("Payment completed and order placed successfully.");
      navigate("/billing");
    } catch (err) {
      setError(err.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-demo-wrap">
      <div className="payment-demo-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="payment-demo-grid">
          <div className="payment-demo-col">
            <span className="payment-demo-title">Payment Method</span>
            <div className="payment-demo-card">
              <div className="payment-demo-accordion">
                <button className="payment-demo-acc-btn" type="button">
                  <span>Paypal</span>
                  <img src="https://i.imgur.com/7kQEsHU.png" width="30" alt="Paypal" />
                </button>
                <div className="payment-demo-acc-body">
                  <input
                    type="email"
                    className="payment-demo-input"
                    placeholder="Paypal email"
                    value={payment.paypalEmail}
                    onChange={(e) => setPayment((p) => ({ ...p, paypalEmail: e.target.value }))}
                    onBlur={() => markTouched("paypalEmail")}
                  />
                  {touched.paypalEmail && paymentErrors.paypalEmail && (
                    <div className="ph-field-error">{paymentErrors.paypalEmail}</div>
                  )}
                </div>

                <button className="payment-demo-acc-btn is-active" type="button">
                  <span>Credit card</span>
                  <span className="payment-demo-icons">
                    <img src="https://i.imgur.com/2ISgYja.png" width="30" alt="Mastercard" />
                    <img src="https://i.imgur.com/W1vtnOV.png" width="30" alt="Visa" />
                    <img src="https://i.imgur.com/35tC99g.png" width="30" alt="Stripe" />
                    <img src="https://i.imgur.com/2ISgYja.png" width="30" alt="Mastercard" />
                  </span>
                </button>
                <div className="payment-demo-acc-body is-open">
                  <div className="payment-demo-field">
                    <span className="payment-demo-label">Card Number</span>
                    <div className="payment-demo-input-wrap">
                      <i className="fa fa-credit-card" aria-hidden="true" />
                      <input
                        type="text"
                        className="payment-demo-input"
                        placeholder="0000 0000 0000 0000"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={formatCardNumber(payment.cardNumberDigits)}
                        onChange={(e) => {
                          const digits = onlyDigits(e.target.value).slice(0, 16);
                          setPayment((p) => ({ ...p, cardNumberDigits: digits }));
                        }}
                        onBlur={() => markTouched("cardNumberDigits")}
                        maxLength={19}
                      />
                    </div>
                    {touched.cardNumberDigits && paymentErrors.cardNumberDigits && (
                      <div className="ph-field-error">{paymentErrors.cardNumberDigits}</div>
                    )}
                  </div>

                  <div className="payment-demo-row">
                    <div className="payment-demo-field">
                      <span className="payment-demo-label">Expiry Date</span>
                      <div className="payment-demo-input-wrap">
                        <i className="fa fa-calendar" aria-hidden="true" />
                        <input
                          type="text"
                          className="payment-demo-input"
                          placeholder="MM/YY"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          value={payment.expiry}
                          onChange={(e) => {
                            const next = formatExpiry(e.target.value);
                            setPayment((p) => ({ ...p, expiry: next }));
                          }}
                          onBlur={() => markTouched("expiry")}
                          maxLength={5}
                        />
                      </div>
                      {touched.expiry && paymentErrors.expiry && (
                        <div className="ph-field-error">{paymentErrors.expiry}</div>
                      )}
                    </div>

                    <div className="payment-demo-field">
                      <span className="payment-demo-label">CVC/CVV</span>
                      <div className="payment-demo-input-wrap">
                        <i className="fa fa-lock" aria-hidden="true" />
                        <input
                          type="text"
                          className="payment-demo-input"
                          placeholder="000"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          value={payment.cvvDigits}
                          onChange={(e) => {
                            const digits = onlyDigits(e.target.value).slice(0, 3);
                            setPayment((p) => ({ ...p, cvvDigits: digits }));
                          }}
                          onBlur={() => markTouched("cvvDigits")}
                          maxLength={3}
                        />
                      </div>
                      {touched.cvvDigits && paymentErrors.cvvDigits && (
                        <div className="ph-field-error">{paymentErrors.cvvDigits}</div>
                      )}
                    </div>
                  </div>

                  <span className="payment-demo-note">
                    <i className="fa fa-lock" aria-hidden="true" /> Your transaction is secured with ssl certificate
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-demo-col">
            <span className="payment-demo-title">Summary</span>
            <div className="payment-demo-card">
              <div className="payment-demo-summary-head">
                <div>
                  <span>Pro(Billed Monthly) <i className="fa fa-caret-down" aria-hidden="true" /></span>
                  <button className="payment-demo-link" type="button">
                    Save 20% with annual billing
                  </button>
                </div>
                <div className="payment-demo-price">
                  <sup>Rs {subtotal.toFixed(2)}</sup>
                  <span>/Order</span>
                </div>
              </div>

              <hr className="payment-demo-divider" />

              <div className="payment-demo-summary-body">
                <div className="payment-demo-summary-row">
                  <span>Refferal Bonouses</span>
                  <span>-$2.00</span>
                </div>
                <div className="payment-demo-summary-row">
                  <span>Vat <i className="fa fa-clock-o" aria-hidden="true" /></span>
                  <span>-20%</span>
                </div>
              </div>

              <hr className="payment-demo-divider" />

              <div className="payment-demo-summary-foot">
                <div>
                  <span>Today you pay (LKR)</span>
                  <small>{items.length} item(s) in cart</small>
                </div>
                <span>Rs {subtotal.toFixed(2)}</span>
              </div>

              <div className="payment-demo-actions">
                <MedixButton
                  type="button"
                  className="payment-demo-btn"
                  block
                  variant="primary"
                  onClick={payNow}
                  disabled={submitting || items.length === 0 || paymentHasErrors}
                >
                  {submitting ? "Processing..." : "Pay Now"}
                </MedixButton>
                <div className="payment-demo-center">
                  <MedixButton type="button" variant="ghost" onClick={() => navigate("/cart")}>
                    Back to cart
                  </MedixButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}