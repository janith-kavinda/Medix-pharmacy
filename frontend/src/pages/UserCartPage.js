import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
      imageUrl: item?.imageUrl || "",
    }))
    .filter((item) => Boolean(getCartId(item)));
}

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
  const [items, setItems] = useState(getStoredCart());
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const syncCart = () => setItems(getStoredCart());
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener("focus", syncCart);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("focus", syncCart);
    };
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [items]);

  const updateQty = (id, qty) => {
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

  const removeItem = (id) => {
    const next = items.filter((item) => getCartId(item) !== id);
    setItems(next);
    saveCart(next);
  };

  const clearCart = () => {
    setItems([]);
    saveCart([]);
  };

  const handlePay = () => {
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
      color: #00d9a3;
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

    .qty-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.4rem 0.6rem;
      font-weight: 700;
      color: #0f3b5f;
      font-size: 1rem;
      transition: all 0.2s;
      border-radius: 4px;
    }

    .qty-btn:hover {
      background: #e0e0e0;
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

    .btn-remove-cart {
      background: #fee2e2;
      color: #991b1b;
      border: none;
      padding: 0.6rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .btn-remove-cart:hover {
      background: #fecaca;
      transform: scale(1.05);
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
      border-top: 2px solid #eee;
      margin-top: 1rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #00d9a3;
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

    .btn-checkout {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-checkout.primary {
      background: linear-gradient(135deg, #0d9488 0%, #0f3b5f 100%);
      color: white;
    }

    .btn-checkout.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
    }

    .btn-checkout.secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-checkout.secondary:hover {
      background: #e8e8e8;
    }

    .btn-checkout:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .btn-continue-shopping {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488 0%, #0f3b5f 100%);
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-continue-shopping:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
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
      <section className="public-hero-card cart-shell">
        <div className="inventory-head">
          <div>
            <p className="public-kicker">Shopping Cart</p>
            <h1 className="public-title inventory-title">Your Medicine Cart</h1>
            <p className="public-subtitle">Review your selected medicines before checkout.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2 className="empty-cart-title">Your Cart is Empty</h2>
            <p className="empty-cart-text">Start adding medicines to your cart from our catalog.</p>
            <button 
              type="button" 
              className="btn-continue-shopping"
              onClick={() => navigate("/medicines")}
            >
              Continue Shopping
            </button>
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
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(itemId, qty - 1)}
                          disabled={qty <= 1}
                        >
                          −
                        </button>
                        <input
                          className="qty-input"
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => updateQty(itemId, e.target.value)}
                        />
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(itemId, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        type="button" 
                        className="btn-remove-cart"
                        onClick={() => removeItem(itemId)}
                      >
                        Remove
                      </button>
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
                <button 
                  type="button" 
                  className="btn-checkout primary"
                  onClick={handlePay} 
                  disabled={paying}
                >
                  {paying ? "Processing..." : "Proceed to Payment"}
                </button>
                <button 
                  type="button" 
                  className="btn-checkout secondary"
                  onClick={() => navigate("/medicines")}
                  disabled={paying}
                >
                  Continue Shopping
                </button>
                <button 
                  type="button" 
                  className="btn-checkout secondary"
                  onClick={clearCart}
                  disabled={paying}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <style>{cartPageStyles}</style>
    </div>
  );
}
