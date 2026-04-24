import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { medicinesApi } from "../api/client";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function UserInventoryPage() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [addedIds, setAddedIds] = useState([]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await medicinesApi.getAll();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("medix_user");
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(raw);
      const role = String(user?.role || "").toLowerCase();
      if (!user || role === "admin") {
        navigate("/login", { replace: true });
        return;
      }
    } catch {
      navigate("/login", { replace: true });
      return;
    }

    fetchMedicines();
  }, [navigate]);

  const handleAdd = (medicine) => {
    setAddedIds((prev) => (prev.includes(medicine._id) ? prev : [...prev, medicine._id]));

    const raw = localStorage.getItem("medix_selected_medicines");
    let selected = [];
    try {
      selected = raw ? JSON.parse(raw) : [];
    } catch {
      selected = [];
    }

    const exists = selected.some((item) => item._id === medicine._id);
    if (!exists) {
      selected.push({
        _id: medicine._id,
        name: medicine.name,
        price: medicine.price,
        manufacturer: medicine.manufacturer,
        quantity: 1,
      });
      localStorage.setItem("medix_selected_medicines", JSON.stringify(selected));
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((m) => {
      const name = String(m?.name || "").toLowerCase();
      const maker = String(m?.manufacturer || "").toLowerCase();
      return name.includes(q) || maker.includes(q);
    });
  }, [medicines, search]);

  return (
    <div className="public-main">
      <section className="public-hero-card inventory-hero">
        <div className="inventory-head">
          <div>
            <p className="public-kicker">User Portal</p>
            <h1 className="public-title inventory-title">Available Inventory</h1>
            <p className="public-subtitle">View all pharmacy medicines and add items you need.</p>
          </div>
          <div className="inventory-controls">
            <div className="inventory-search-wrap">
              <input
                type="search"
                className="inventory-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by medicine or manufacturer"
                aria-label="Search inventory"
              />
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="table-wrap inventory-table-wrap">
          {loading ? (
            <p className="loading">Loading inventory...</p>
          ) : filtered.length === 0 ? (
            <p className="empty">No medicines found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Manufacturer</th>
                  <th>Price</th>
                  <th>Available Qty</th>
                  <th>Expiry Date</th>
                  <th>Add</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m._id}>
                    <td>{m.name}</td>
                    <td>{m.manufacturer || "-"}</td>
                    <td>Rs {Number(m.price || 0).toFixed(2)}</td>
                    <td>{Number(m.quantity || 0)}</td>
                    <td>{formatDate(m.expiryDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAdd(m)}
                        disabled={addedIds.includes(m._id)}
                      >
                        {addedIds.includes(m._id) ? "Added" : "Add"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
