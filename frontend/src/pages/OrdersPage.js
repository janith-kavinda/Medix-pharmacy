import React, { useState, useEffect } from 'react';
import { ordersApi, medicinesApi } from '../api/client';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    medicineName: '',
    quantity: '',
    price: '',
    totalPrice: '',
    status: 'Pending',
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
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
    fetchOrders();
    fetchMedicines();
  }, []);

  const resetForm = () => {
    setForm({
      customerName: '',
      medicineName: '',
      quantity: '',
      price: '',
      totalPrice: '',
      status: 'Pending',
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
      setForm((p) => ({ ...p, totalPrice: (qty * pr).toFixed(2) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customerName: form.customerName,
        medicineName: form.medicineName,
        quantity: parseInt(form.quantity, 10) || 0,
        price: parseFloat(form.price) || 0,
        totalPrice: parseFloat(form.totalPrice) || 0,
        status: form.status,
      };
      if (editing) {
        await ordersApi.update(editing._id, payload);
      } else {
        await ordersApi.create(payload);
      }
      resetForm();
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to save order');
    }
  };

  const handleEdit = (o) => {
    setEditing(o);
    setForm({
      customerName: o.customerName,
      medicineName: o.medicineName,
      quantity: o.quantity,
      price: o.price,
      totalPrice: o.totalPrice,
      status: o.status || 'Pending',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await ordersApi.delete(id);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Orders</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm({ customerName: '', medicineName: '', quantity: '', price: '', totalPrice: '', status: 'Pending' }); }}>
          New Order
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card form-card">
          <h2>{editing ? 'Edit Order' : 'New Order'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Customer Name *</label>
              <input name="customerName" value={form.customerName} onChange={handleChange} required placeholder="Customer name" />
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
            <div className="form-row two-col">
              <div>
                <label>Total (Rs)</label>
                <input type="text" value={form.totalPrice} readOnly placeholder="Auto" />
              </div>
              <div>
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
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
        ) : orders.length === 0 ? (
          <p className="empty">No orders yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.customerName}</td>
                  <td>{o.medicineName}</td>
                  <td>{o.quantity}</td>
                  <td>Rs {parseFloat(o.price).toFixed(2)}</td>
                  <td>Rs {parseFloat(o.totalPrice).toFixed(2)}</td>
                  <td><span className={`badge badge-${o.status?.toLowerCase()}`}>{o.status}</span></td>
                  <td>
                    <button className="btn btn-sm" onClick={() => handleEdit(o)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o._id)}>Delete</button>
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
