import React, { useState, useEffect } from 'react';
import { billingsApi, medicinesApi } from '../api/client';

export default function BillingPage() {
  const [billings, setBillings] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    customerName: 'Walk-in',
    medicineName: '',
    quantity: '',
    price: '',
    total: '',
  });

  const fetchBillings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingsApi.getAll();
      setBillings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch billings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const data = await medicinesApi.getAll();
      setMedicines(data);
    } catch (err) {
      console.error('Failed to fetch medicines', err);
    }
  };

  useEffect(() => {
    fetchBillings();
    fetchMedicines();
  }, []);

  const resetForm = () => {
    setForm({
      customerName: 'Walk-in',
      medicineName: '',
      quantity: '',
      price: '',
      total: '',
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'medicineName') {
      const med = medicines.find((m) => m.name === value);
      if (med) setForm((p) => ({ ...p, price: med.price }));
    }
    if (name === 'quantity' || name === 'price') {
      const qty = name === 'quantity' ? parseFloat(value) || 0 : parseFloat(form.quantity) || 0;
      const pr = name === 'price' ? parseFloat(value) || 0 : parseFloat(form.price) || 0;
      setForm((p) => ({ ...p, total: (qty * pr).toFixed(2) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customerName: form.customerName || 'Walk-in',
        medicineName: form.medicineName,
        quantity: parseInt(form.quantity, 10) || 0,
        price: parseFloat(form.price) || 0,
        total: parseFloat(form.total) || 0,
      };
      if (editing) {
        await billingsApi.update(editing._id, payload);
      } else {
        await billingsApi.create(payload);
      }
      resetForm();
      fetchBillings();
    } catch (err) {
      setError(err.message || 'Failed to save billing');
    }
  };

  const handleEdit = (b) => {
    setEditing(b);
    setForm({
      customerName: b.customerName || 'Walk-in',
      medicineName: b.medicineName,
      quantity: b.quantity,
      price: b.price,
      total: b.total,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this billing record?')) return;
    try {
      await billingsApi.delete(id);
      fetchBillings();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Billing</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm({ customerName: 'Walk-in', medicineName: '', quantity: '', price: '', total: '' }); }}>
          New Bill
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card form-card">
          <h2>{editing ? 'Edit Bill' : 'New Bill'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Customer Name</label>
              <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Walk-in" />
            </div>
            <div className="form-row">
              <label>Medicine *</label>
              <select name="medicineName" value={form.medicineName} onChange={handleChange} required>
                <option value="">Select medicine</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m.name}>{m.name} (Rs {m.price})</option>
                ))}
              </select>
            </div>
            <div className="form-row two-col">
              <div>
                <label>Quantity *</label>
                <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required placeholder="0" />
              </div>
              <div>
                <label>Price (Rs) *</label>
                <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} required placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <label>Total (Rs)</label>
              <input type="text" value={form.total} readOnly placeholder="Auto" />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-card">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : billings.length === 0 ? (
          <p className="empty">No billing records yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {billings.map((b) => (
                <tr key={b._id}>
                  <td>{b.customerName || 'Walk-in'}</td>
                  <td>{b.medicineName}</td>
                  <td>{b.quantity}</td>
                  <td>Rs {parseFloat(b.price).toFixed(2)}</td>
                  <td>Rs {parseFloat(b.total).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => handleEdit(b)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
