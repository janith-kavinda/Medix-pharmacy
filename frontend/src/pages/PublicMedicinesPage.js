import React, { useEffect, useMemo, useState } from "react";
import { medicinesApi } from "../api/client";
import { useNavigate } from "react-router-dom";

// Pharmacy images for fallback display
import pharmacyImg1 from "../images/alexander-grey-FEPfs43yiPE-unsplash.jpg";
import pharmacyImg2 from "../images/christina-victoria-craft-ZHys6xN7sUE-unsplash.jpg";
import pharmacyImg3 from "../images/christine-sandu-jwWtZrm67VI-unsplash.jpg";
import pharmacyImg4 from "../images/etactics-inc-tNjUkPNL-00-unsplash.jpg";
import pharmacyImg5 from "../images/female-pharmacist-with-table-checking-stock-pharmacy.jpg";
import pharmacyImg6 from "../images/freestocks-nss2eRzQwgw-unsplash.jpg";
import pharmacyImg7 from "../images/pharmacist-day-celebration-with-male-pharmacist.jpg";
import pharmacyImg8 from "../images/shawn-powar-2vaUkcFfWtE-unsplash.jpg";
import pharmacyImg9 from "../images/simone-van-der-koelen-HtDQ9Z64Vpo-unsplash.jpg";
import pharmacyImg10 from "../images/thomas-kinto-2nCs2Ed_XU8-unsplash.jpg";
import pharmacyImg11 from "../images/young-hispanic-man-pharmacist-smiling-confident-scanning-pills-bottle-pharmacy.jpg";

const pharmacyImages = [
  pharmacyImg1,
  pharmacyImg2,
  pharmacyImg3,
  pharmacyImg4,
  pharmacyImg5,
  pharmacyImg6,
  pharmacyImg7,
  pharmacyImg8,
  pharmacyImg9,
  pharmacyImg10,
  pharmacyImg11,
];

// Specific medicine to image mappings
const medicineImageMappings = {
  "Vitamin C 500mg": pharmacyImg1,
  "Metformin 500mg": pharmacyImg3,
  "Cough Syrup": pharmacyImg4,
};

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

function getPlaceholderImage(name) {
  const label = encodeURIComponent(String(name || "Medicine").slice(0, 18));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 360'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#0d9488'/><stop offset='100%' stop-color='#0f3b5f'/></linearGradient></defs><rect width='600' height='360' fill='url(#g)'/><circle cx='520' cy='70' r='80' fill='rgba(255,255,255,0.12)'/><circle cx='90' cy='300' r='110' fill='rgba(255,255,255,0.08)'/><text x='300' y='190' fill='white' text-anchor='middle' font-size='34' font-family='Arial' font-weight='700'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getGoogleImagesUrl(medicineName) {
  return `https://www.google.com/search?q=${encodeURIComponent(medicineName + ' medicine')}&tbm=isch`;
}

function getPharmacyFallbackImage(medicineName) {
  // Check if there's a specific mapping for this medicine
  if (medicineImageMappings[medicineName]) {
    return medicineImageMappings[medicineName];
  }

  // Create hash from medicine name to ensure same medicine always gets same image
  let hash = 0;
  for (let i = 0; i < medicineName.length; i++) {
    const char = medicineName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % pharmacyImages.length;
  return pharmacyImages[index];
}

export default function PublicMedicinesPage() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = localStorage.getItem("medix_selected_medicines");
      const parsed = raw ? JSON.parse(raw) : [];
      return normalizeCartList(parsed);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await medicinesApi.getAll();
        setMedicines(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load medicines.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((m) => {
      const name = String(m?.name || "").toLowerCase();
      const maker = String(m?.manufacturer || "").toLowerCase();
      const price = Number(m?.price || 0);
      
      // Search filter
      const matchesSearch = !q || name.includes(q) || maker.includes(q);
      
      // Manufacturer filter
      const matchesManufacturer = !manufacturerFilter || maker === manufacturerFilter.toLowerCase();
      
      // Price range filter
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      
      return matchesSearch && matchesManufacturer && matchesPrice;
    });
  }, [medicines, search, manufacturerFilter, priceRange]);

  const manufacturers = useMemo(() => {
    const unique = new Set(medicines.map((m) => String(m?.manufacturer || "").trim()).filter(Boolean));
    return Array.from(unique).sort();
  }, [medicines]);

  const getStockStatus = (qty) => {
    const stock = Number(qty || 0);
    if (stock === 0) return { label: "Out of Stock", color: "#dc2626", class: "out-stock" };
    if (stock < 5) return { label: "Low Stock", color: "#f59e0b", class: "low-stock" };
    return { label: "In Stock", color: "#10b981", class: "in-stock" };
  };

  const handleAdd = (medicine) => {
    const raw = localStorage.getItem("medix_selected_medicines");
    let selected = [];
    try {
      selected = normalizeCartList(raw ? JSON.parse(raw) : []);
    } catch {
      selected = [];
    }

    const medicineId = getCartId(medicine);

    const index = selected.findIndex((item) => getCartId(item) === medicineId);
    if (index >= 0) {
      const updated = [...selected];
      const current = updated[index];
      updated[index] = {
        ...current,
        quantity: Number(current.quantity || 1) + 1,
      };
      localStorage.setItem("medix_selected_medicines", JSON.stringify(updated));
      setCartItems(updated);
      return;
    }

    selected.push({
      _id: medicine._id || medicine.id || medicine.name,
      name: medicine.name,
      price: Number(medicine.price || 0),
      manufacturer: medicine.manufacturer,
      quantity: 1,
    });
    localStorage.setItem("medix_selected_medicines", JSON.stringify(selected));
    setCartItems(selected);
  };

  const setMedicineQty = (medicine, nextQty) => {
    const raw = localStorage.getItem("medix_selected_medicines");
    let selected = [];
    try {
      selected = normalizeCartList(raw ? JSON.parse(raw) : []);
    } catch {
      selected = [];
    }

    const medicineId = getCartId(medicine);
    const maxStock = Math.max(0, Number(medicine?.quantity || 0));
    const safeQty = Math.max(0, Math.min(Number(nextQty) || 0, maxStock));
    const index = selected.findIndex((item) => getCartId(item) === medicineId);

    if (safeQty === 0) {
      const updated = selected.filter((item) => getCartId(item) !== medicineId);
      localStorage.setItem("medix_selected_medicines", JSON.stringify(updated));
      setCartItems(updated);
      return;
    }

    if (index >= 0) {
      const updated = [...selected];
      updated[index] = {
        ...updated[index],
        quantity: safeQty,
      };
      localStorage.setItem("medix_selected_medicines", JSON.stringify(updated));
      setCartItems(updated);
      return;
    }

    const updated = [
      ...selected,
      {
        _id: medicine._id || medicine.id || medicine.name,
        name: medicine.name,
        price: Number(medicine.price || 0),
        manufacturer: medicine.manufacturer,
        quantity: safeQty,
      },
    ];
    localStorage.setItem("medix_selected_medicines", JSON.stringify(updated));
    setCartItems(updated);
  };

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    [cartItems]
  );

  const publicPageStyles = `
    .public-catalog-page-full {
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
    }

    .public-catalog-page-full .public-hero-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-radius: 0;
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 2rem 2.5rem;
    }

    .medicine-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
      width: 100%;
    }

    .medicine-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .medicine-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .medicine-card-image {
      width: 100%;
      height: 220px;
      object-fit: cover;
      background: linear-gradient(135deg, #0d9488 0%, #0f3b5f 100%);
      display: block;
      transition: transform 0.3s ease;
    }

    .medicine-card:hover .medicine-card-image {
      transform: scale(1.05);
    }

    .medicine-image-link-wrapper {
      position: relative;
      overflow: hidden;
      display: block;
      width: 100%;
      height: 220px;
      background: linear-gradient(135deg, #0d9488 0%, #0f3b5f 100%);
    }

    .medicine-image-link-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .medicine-image-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
    }

    .medicine-image-link-wrapper:hover .medicine-image-overlay {
      background: rgba(0, 0, 0, 0.4);
    }

    .google-images-icon {
      opacity: 0;
      transition: opacity 0.3s ease;
      font-size: 2rem;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background: rgba(0, 217, 163, 0.9);
      border-radius: 50%;
      cursor: pointer;
    }

    .medicine-image-link-wrapper:hover .google-images-icon {
      opacity: 1;
    }

    .medicine-card-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: 0.75rem;
    }

    .medicine-card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
      line-height: 1.3;
    }

    .medicine-card-meta {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }

    .medicine-card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
    }

    .medicine-card-price {
      font-size: 1.3rem;
      font-weight: 700;
      color: #00d9a3;
    }

    .medicine-card-qty {
      font-size: 0.9rem;
      color: #666;
      background: #f5f5f5;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
    }

    .row-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      justify-content: space-between;
      margin: 0.5rem 0;
    }

    .row-actions .btn {
      flex: 0 0 auto;
    }

    .row-actions .medicine-card-qty {
      flex-grow: 1;
      text-align: center;
    }

    .inventory-search {
      border: 2px solid #e0e0e0;
      transition: all 0.2s;
    }

    .inventory-search:focus {
      border-color: #00d9a3;
      box-shadow: 0 0 0 3px rgba(0, 217, 163, 0.1);
    }

    .btn-block {
      width: 100%;
      margin-top: auto;
    }

    .inventory-head {
      border-bottom: 2px solid #e8e8e8;
      padding-bottom: 1.5rem;
      margin-bottom: 0;
    }

    .medicine-filters {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 1rem;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
    }

    .filter-group select,
    .filter-group input {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: #00d9a3;
      box-shadow: 0 0 0 3px rgba(0, 217, 163, 0.1);
    }

    .stock-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.7rem;
      border-radius: 20px;
      display: inline-block;
      text-transform: uppercase;
      margin-top: 0.5rem;
    }

    .stock-badge.in-stock {
      background-color: #d1fae5;
      color: #065f46;
    }

    .stock-badge.low-stock {
      background-color: #fef3c7;
      color: #92400e;
    }

    .stock-badge.out-stock {
      background-color: #fee2e2;
      color: #7f1d1d;
    }

    .medicine-expiry {
      font-size: 0.85rem;
      color: #888;
      margin-top: 0.5rem;
      display: block;
    }

    .details-panel {
      position: fixed;
      right: 0;
      top: 0;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
      overflow-y: auto;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }

    .details-panel-header {
      padding: 1.5rem;
      border-bottom: 2px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .details-panel-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0;
    }

    .close-panel-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      transition: color 0.2s;
    }

    .close-panel-btn:hover {
      color: #000;
    }

    .details-panel-image {
      width: 100%;
      height: 300px;
      object-fit: cover;
    }

    .details-panel-body {
      padding: 1.5rem;
    }

    .detail-row {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .detail-label {
      font-weight: 600;
      color: #666;
      font-size: 0.9rem;
    }

    .detail-value {
      font-weight: 700;
      color: #1a1a1a;
      font-size: 1.1rem;
    }

    .details-description {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.95rem;
      color: #555;
      line-height: 1.6;
    }

    .overlay-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .btn-view-details {
      background: #0f3b5f;
      color: white;
      border: none;
      padding: 0.7rem 1.2rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      margin-top: 0.5rem;
    }

    .btn-view-details:hover {
      background: #0a2847;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .medicine-filters {
        grid-template-columns: 1fr;
      }

      .details-panel {
        width: 100%;
      }

      .public-catalog-page-full .public-hero-card {
        padding: 1.5rem 1rem;
      }

      .medicine-card-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1.5rem;
      }

      .medicine-card-image {
        height: 180px;
      }

      .medicine-card-body {
        padding: 1rem;
      }
    }

    @media (max-width: 480px) {
      .medicine-card-grid {
        grid-template-columns: 1fr;
      }

      .inventory-controls {
        flex-direction: column;
        gap: 0.75rem;
      }

      .inventory-search-wrap,
      .btn {
        width: 100%;
      }
    }
  `;

  return (
    <div className="public-catalog-page-full">
      <section className="public-hero-card medicine-catalog-shell">
        <div className="inventory-head">
          <div>
            <p className="public-kicker">Medicine Catalog</p>
            <h1 className="public-title inventory-title">Choose Medicines</h1>
            <p className="public-subtitle">Browse all medicines and add items to your selection.</p>
          </div>
          <div className="inventory-controls">
            <div className="inventory-search-wrap">
              <input
                type="search"
                className="inventory-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine or manufacturer"
                aria-label="Search medicines"
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={() => navigate("/cart")}>
              Go to Cart ({cartCount})
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && filtered.length > 0 && (
          <div className="medicine-filters">
            <div className="filter-group">
              <label htmlFor="manufacturer-filter">Filter by Manufacturer</label>
              <select
                id="manufacturer-filter"
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
              >
                <option value="">All Manufacturers</option>
                {manufacturers.map((mfg) => (
                  <option key={mfg} value={mfg}>{mfg}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="price-filter">Max Price: Rs {priceRange[1]}</label>
              <input
                id="price-filter"
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              />
            </div>

            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setManufacturerFilter("");
                setPriceRange([0, 10000]);
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="loading">Loading medicines...</p>
        ) : filtered.length === 0 ? (
          <p className="empty">No medicines found.</p>
        ) : (
          <div className="medicine-card-grid">
            {filtered.map((med) => {
              const medId = getCartId(med);
              const inCart = cartItems.find((item) => getCartId(item) === medId);
              const selectedQty = Number(inCart?.quantity || 0);
              const availableQty = Math.max(0, Number(med.quantity || 0));
              const canIncrease = selectedQty < availableQty;
              return (
                <article className="medicine-card" key={med._id}>
                  <a 
                    href={getGoogleImagesUrl(med.name)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="medicine-image-link-wrapper"
                    title="Search for this medicine on Google Images"
                  >
                    <img
                      className="medicine-card-image"
                      src={med.imageUrl || getPharmacyFallbackImage(med.name)}
                      alt={`${med.name} medicine`}
                      onError={(e) => {
                        e.target.src = getPharmacyFallbackImage(med.name);
                      }}
                    />
                    <div className="medicine-image-overlay">
                      <div className="google-images-icon">🔍</div>
                    </div>
                  </a>
                  <div className="medicine-card-body">
                    <h3 className="medicine-card-title">{med.name}</h3>
                    <p className="medicine-card-meta">{med.manufacturer || "Unknown Manufacturer"}</p>
                    
                    <div className="stock-badge" style={{ backgroundColor: getStockStatus(availableQty).color ? `${getStockStatus(availableQty).color}20` : undefined, color: getStockStatus(availableQty).color }}>
                      {getStockStatus(availableQty).label}
                    </div>

                    {med.expiryDate && (
                      <span className="medicine-expiry">
                        📅 Expires: {new Date(med.expiryDate).toLocaleDateString()}
                      </span>
                    )}

                    <div className="medicine-card-row">
                      <span className="medicine-card-price">Rs {Number(med.price || 0).toFixed(2)}</span>
                      <span className="medicine-card-qty">Stock: {availableQty}</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-view-details btn-block"
                      onClick={() => setSelectedMedicine(med)}
                    >
                      View Details
                    </button>

                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setMedicineQty(med, selectedQty - 1)}
                        disabled={selectedQty <= 0}
                      >
                        -
                      </button>
                      <span className="medicine-card-qty">In cart: {selectedQty}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setMedicineQty(med, selectedQty + 1)}
                        disabled={!canIncrease}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={() => handleAdd(med)}
                      disabled={!canIncrease}
                    >
                      {canIncrease ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedMedicine && (
        <>
          <div className="overlay-backdrop" onClick={() => setSelectedMedicine(null)} />
          <div className="details-panel">
            <div className="details-panel-header">
              <h2 className="details-panel-title">{selectedMedicine.name}</h2>
              <button 
                className="close-panel-btn"
                onClick={() => setSelectedMedicine(null)}
                aria-label="Close details panel"
              >
                ✕
              </button>
            </div>

            <img 
              className="details-panel-image"
              src={selectedMedicine.imageUrl || getPharmacyFallbackImage(selectedMedicine.name)}
              alt={selectedMedicine.name}
              onError={(e) => {
                e.target.src = getPharmacyFallbackImage(selectedMedicine.name);
              }}
            />

            <div className="details-panel-body">
              <div className="detail-row">
                <span className="detail-label">Manufacturer</span>
                <span className="detail-value">{selectedMedicine.manufacturer || "N/A"}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Price</span>
                <span className="detail-value">Rs {Number(selectedMedicine.price || 0).toFixed(2)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Stock Available</span>
                <span className="detail-value">{Number(selectedMedicine.quantity || 0)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Stock Status</span>
                <span 
                  style={{ color: getStockStatus(selectedMedicine.quantity).color }}
                  className="detail-value"
                >
                  {getStockStatus(selectedMedicine.quantity).label}
                </span>
              </div>

              {selectedMedicine.expiryDate && (
                <div className="detail-row">
                  <span className="detail-label">Expiry Date</span>
                  <span className="detail-value">
                    {new Date(selectedMedicine.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {selectedMedicine.description && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <span className="detail-label" style={{ display: "block", marginBottom: "0.75rem" }}>Description</span>
                  <div className="details-description">{selectedMedicine.description}</div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  handleAdd(selectedMedicine);
                  setSelectedMedicine(null);
                }}
                disabled={Number(selectedMedicine.quantity || 0) === 0}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </>
      )}
      <style>{publicPageStyles}</style>
    </div>
  );
}
