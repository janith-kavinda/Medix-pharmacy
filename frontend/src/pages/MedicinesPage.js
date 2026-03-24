import React, { useState, useEffect } from 'react';
import { medicinesApi } from '../api/client';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    price: '',
    quantity: '',
    expiryDate: '',
    description: '',
  });

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await medicinesApi.getAll();
      setMedicines(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      manufacturer: '',
      price: '',
      quantity: '',
      expiryDate: '',
      description: '',
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        manufacturer: form.manufacturer || undefined,
        price: parseFloat(form.price) || 0,
        quantity: parseInt(form.quantity, 10) || 0,
        expiryDate: form.expiryDate || undefined,
        description: form.description || undefined,
      };
      if (editing) {
        await medicinesApi.update(editing._id, payload);
      } else {
        await medicinesApi.create(payload);
      }
      resetForm();
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to save medicine');
    }
  };

  const handleEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      manufacturer: m.manufacturer || '',
      price: m.price || '',
      quantity: m.quantity ?? '',
      expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : '',
      description: m.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    try {
      await medicinesApi.delete(id);
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Medicines (Inventory)</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', manufacturer: '', price: '', quantity: '', expiryDate: '', description: '' }); }}>
          Add Medicine
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card form-card">
          <h2>{editing ? 'Edit Medicine' : 'Add Medicine'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Medicine name" />
            </div>
            <div className="form-row">
              <label>Manufacturer</label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="Manufacturer" />
            </div>
            <div className="form-row two-col">
              <div>
                <label>Price (Rs) *</label>
                <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} required placeholder="0" />
              </div>
              <div>
                <label>Quantity</label>
                <input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <label>Expiry Date</label>
              <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={2} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-card">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : medicines.length === 0 ? (
          <p className="empty">No medicines yet. Add one to get started.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Manufacturer</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td>{m.manufacturer || '-'}</td>
                  <td>Rs {parseFloat(m.price).toFixed(2)}</td>
                  <td>{m.quantity}</td>
                  <td>{formatDate(m.expiryDate)}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => handleEdit(m)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m._id)}>Delete</button>
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
