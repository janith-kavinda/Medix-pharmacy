import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MedixPublicHero from "../components/MedixPublicHero";
import MedixButton from "../components/ui/MedixButton";
import cartHeroImage from "../images/female-pharmacist-with-table-checking-stock-pharmacy.jpg";

function readLoggedIn() {
  try {
    const raw = localStorage.getItem("medix_user");
    if (!raw) return false;
    const u = JSON.parse(raw);
    return Boolean(u?._id || u?.email);
  } catch {
    return false;
  }
}

function getCartId(item) {
  return String(item?._id || item?.id || item?.name || "");
}
//Normalize cart list
function normalizeCartList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      _id: item?._id || item?.id || item?.medicineId || item?.name,
      name: item?.name || item?.medicineName || "Unknown Medicine",
      price: Number(item?.price || 0),
      manufacturer: item?.manufacturer || "",
      quantity: Math.max(1, Number(item?.quantity || 1)),
      imageUrl: item?.imageUrl || "",
    }))
    .filter((item) => Boolean(getCartId(item)));
}
//Generate image
function getPlaceholderImage(name) {
  const label = encodeURIComponent(String(name || "Medicine").slice(0, 18));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 360'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#0d9488'/><stop offset='100%' stop-color='#0f3b5f'/></linearGradient></defs><rect width='600' height='360' fill='url(#g)'/><circle cx='520' cy='70' r='80' fill='rgba(255,255,255,0.12)'/><circle cx='90' cy='300' r='110' fill='rgba(255,255,255,0.08)'/><text x='300' y='190' fill='white' text-anchor='middle' font-size='34' font-family='Arial' font-weight='700'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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

function saveCart(items) {
  const normalized = normalizeCartList(items);
  localStorage.setItem("medix_selected_medicines", JSON.stringify(normalized));
}

export default function UserCartPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => readLoggedIn());
  const [items, setItems] = useState(() => (readLoggedIn() ? getStoredCart() : []));
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const syncAuth = useCallback(() => {
    const next = readLoggedIn();
    setIsLoggedIn(next);
    if (next) {
      setItems(getStoredCart());
    } else {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    const syncCart = () => {
      if (!readLoggedIn()) return;
      setItems(getStoredCart());
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);
    window.addEventListener("storage", syncCart);
    window.addEventListener("focus", syncCart);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("focus", syncCart);
    };
  }, [syncAuth]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [items]);

  const updateQty = (id, qty) => {
    if (!readLoggedIn()) return;
    const safeQty = Math.max(1, Number(qty) || 1);
    const next = items.map((item) =>
      getCartId(item) === id
        ? {
            ...item,
            quantity: safeQty,
          }
        : item
    );
    setItems(next);
    saveCart(next);
  };
//remove items
  const removeItem = (id) => {
    if (!readLoggedIn()) return;
    const next = items.filter((item) => getCartId(item) !== id);
    setItems(next);
    saveCart(next);
  };

  const clearCart = () => {
    if (!readLoggedIn()) return;
    setItems([]);
    saveCart([]);
  };

  const handlePay = () => {
    if (!readLoggedIn()) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    if (items.length === 0) return;

    try {
      setPaying(true);
      setError("");
      setSuccess("");
      navigate("/payment");
    } catch (err) {
      setError(err.message || "Failed to continue.");
    } finally {
      setPaying(false);
    }
  };

  const tax = subtotal * 0.05; // 5% tax
  const delivery = subtotal > 0 ? 100 : 0; // Fixed delivery fee
  const total = subtotal + tax + delivery;

  const cartPageStyles = `
    .cart-page-wrapper {
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
    }

    .cart-page-wrapper .public-hero-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-radius: 0;
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 2rem 2.5rem;
    }

    .cart-container {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      margin-top: 2rem;
    }

    .cart-items-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .cart-item-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: grid;
      grid-template-columns: 140px 1fr 120px;
      gap: 1.5rem;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border-left: 4px solid transparent;
    }

    .cart-item-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-left-color: #00d9a3;
      transform: translateX(4px);
    }

    .cart-item-image {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      background: linear-gradient(135deg, #0d9488 0%, #0f3b5f 100%);
    }

    .cart-item-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .cart-item-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .cart-item-meta {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }

    .cart-item-price {
      font-size: 1.2rem;
      font-weight: 700;
      color: #00529b;
      margin-top: 0.5rem;
    }

    .cart-item-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: flex-end;
    }

    .qty-adjuster {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 0.5rem;
    }

    .qty-adjuster .medix-btn.cart-qty-btn {
      min-width: 2.25rem;
      min-height: 2.25rem;
      padding: 0.2rem 0.45rem;
      font-weight: 800;
      font-size: 1.1rem;
      line-height: 1;
      border: 1px solid rgba(0, 82, 155, 0.25);
      color: #00529b;
      background: #ffffff;
      box-shadow: none;
      text-transform: none;
      letter-spacing: 0;
    }

    .qty-adjuster .medix-btn.cart-qty-btn:hover:not(:disabled) {
      background: #e8f1fd;
      border-color: rgba(0, 82, 155, 0.45);
    }

    .qty-adjuster .medix-btn.cart-qty-btn:disabled {
      opacity: 0.45;
    }

    .qty-input {
      width: 45px;
      text-align: center;
      border: none;
      background: transparent;
      font-weight: 700;
      font-size: 0.95rem;
      color: #1a1a1a;
    }

    .qty-input:focus {
      outline: none;
    }

    .medix-btn.cart-remove-btn {
      padding: 0.5rem 0.95rem;
      font-size: 0.85rem;
      font-weight: 700;
      min-height: 0;
      box-shadow: none;
      text-transform: none;
      letter-spacing: 0.02em;
    }

    .order-summary {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      height: fit-content;
      position: sticky;
      top: 2rem;
    }

    .summary-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 1.5rem 0;
      padding-bottom: 1rem;
      border-bottom: 2px solid #eee;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      font-size: 0.95rem;
      color: #666;
    }

    .summary-row.total {
      padding-top: 1rem;
      border-top: 2px solid #e2ecf8;
      margin-top: 1rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #003d75;
    }

    .summary-row.total span:last-child {
      font-size: 1.3rem;
    }

    .summary-value {
      font-weight: 600;
      color: #1a1a1a;
    }

    .checkout-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .checkout-buttons .medix-btn.btn-checkout,
    .checkout-buttons .medix-btn {
      width: 100%;
      text-transform: none;
      letter-spacing: 0.01em;
      font-weight: 700;
    }

    .empty-cart {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .empty-cart-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-cart-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .empty-cart-text {
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }

    .empty-cart .medix-btn.btn-continue-shopping {
      margin-top: 0.25rem;
    }

    .cart-login-prompt {
      text-align: center;
      padding: 3rem 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      max-width: 480px;
      margin: 2rem auto 0;
    }

    .cart-login-prompt-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
    }

    .cart-login-prompt h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.5rem;
    }

    .cart-login-prompt p {
      color: #666;
      margin: 0 0 1.25rem;
      line-height: 1.55;
      font-size: 0.95rem;
    }

    .cart-login-prompt-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .inventory-head {
      border-bottom: 2px solid #e8e8e8;
      padding-bottom: 1.5rem;
      margin-bottom: 0;
    }

    .alert {
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-weight: 600;
    }

    .alert.alert-error {
      background: #fee2e2;
      color: #991b1b;
      border-left: 4px solid #dc2626;
    }

    .alert.alert-success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }

    @media (max-width: 1024px) {
      .cart-container {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: relative;
        top: 0;
      }
    }

    @media (max-width: 768px) {
      .cart-page-wrapper .public-hero-card {
        padding: 1.5rem 1rem;
      }

      .cart-item-card {
        grid-template-columns: 100px 1fr;
        padding: 1rem;
        gap: 1rem;
      }

      .cart-item-image {
        width: 100px;
        height: 100px;
      }

      .cart-item-controls {
        grid-column: 1 / -1;
        justify-content: space-between;
      }

      .checkout-buttons {
        gap: 0.5rem;
      }

      .btn-checkout {
        padding: 0.8rem;
        font-size: 0.85rem;
      }
    }
  `;

  return (
    <div className="cart-page-wrapper">
      <div className="public-main">
        <MedixPublicHero
          kicker="Shopping Cart"
          title="Your Medicine Cart"
          subtitle="Review your selected medicines before checkout."
          image={cartHeroImage}
          imageAlt="Pharmacist reviewing medicine stock at the counter"
          className="cart-shell"
        />

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!isLoggedIn ? (
          <div className="medix-guest-prompt cart-login-prompt" role="status">
            <p className="medix-guest-emoji" aria-hidden="true">
              🔐
            </p>
            <h2>Sign in to view your cart</h2>
            <p>
              You are not signed in. Please sign in to view and manage your cart, then continue to checkout.
            </p>
            <div className="medix-guest-prompt__actions cart-login-prompt-actions">
              <MedixButton to="/login" state={{ from: "/cart" }} variant="primary">
                Sign in
              </MedixButton>
              <MedixButton to="/signup" variant="ghost">
                Create account
              </MedixButton>
              <MedixButton type="button" variant="muted" onClick={() => navigate("/medicines")}>
                Browse medicines
              </MedixButton>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2 className="empty-cart-title">Your Cart is Empty</h2>
            <p className="empty-cart-text">Start adding medicines to your cart from our catalog.</p>
            <MedixButton type="button" variant="primary" onClick={() => navigate("/medicines")} className="btn-continue-shopping">
              Continue Shopping
            </MedixButton>
          </div>
        ) : (
          <div className="cart-container">
            <div className="cart-items-section">
              {items.map((item) => {
                const itemId = getCartId(item);
                const qty = Number(item.quantity || 1);
                const itemTotal = Number(item.price || 0) * qty;
                return (
                  <div className="cart-item-card" key={itemId}>
                    <img
                      className="cart-item-image"
                      src={item.imageUrl || getPlaceholderImage(item.name)}
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = getPlaceholderImage(item.name);
                      }}
                    />
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <p className="cart-item-meta">{item.manufacturer || "Unknown Manufacturer"}</p>
                      <div className="cart-item-price">Rs {Number(item.price || 0).toFixed(2)}</div>
                      <div style={{ fontSize: "0.9rem", color: "#888", marginTop: "0.5rem" }}>
                        Subtotal: Rs {itemTotal.toFixed(2)}
                      </div>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-adjuster">
                        <MedixButton
                          type="button"
                          variant="ghost"
                          className="cart-qty-btn"
                          onClick={() => updateQty(itemId, qty - 1)}
                          disabled={qty <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </MedixButton>
                        <input
                          className="qty-input"
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => updateQty(itemId, e.target.value)}
                        />
                        <MedixButton
                          type="button"
                          variant="ghost"
                          className="cart-qty-btn"
                          onClick={() => updateQty(itemId, qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </MedixButton>
                      </div>
                      <MedixButton
                        type="button"
                        variant="danger"
                        className="cart-remove-btn"
                        onClick={() => removeItem(itemId)}
                      >
                        Remove
                      </MedixButton>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="order-summary">
              <h2 className="summary-title">Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span className="summary-value">Rs {subtotal.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Tax (5%)</span>
                <span className="summary-value">Rs {tax.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Delivery Fee</span>
                <span className="summary-value">Rs {delivery.toFixed(2)}</span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>Rs {total.toFixed(2)}</span>
              </div>

              <div className="checkout-buttons">
                <MedixButton type="button" variant="primary" onClick={handlePay} disabled={paying} className="btn-checkout">
                  {paying ? "Processing..." : "Proceed to Payment"}
                </MedixButton>
                <MedixButton
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/medicines")}
                  disabled={paying}
                  className="btn-checkout"
                >
                  Continue Shopping
                </MedixButton>
                <MedixButton
                  type="button"
                  variant="danger"
                  onClick={clearCart}
                  disabled={paying}
                  className="btn-checkout"
                >
                  Clear Cart
                </MedixButton>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{cartPageStyles}</style>
    </div>
  );
}