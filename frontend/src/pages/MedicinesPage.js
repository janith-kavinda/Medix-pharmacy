import React, { useRef, useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { medicinesApi } from '../api/client';

const medicinePageStyles = `
  .inventory-page-full {
    padding: 0 !important;
    display: flex;
    flex-direction: column;
  }

  .inventory-page-full > .page-header {
    padding: 28px 32px;
    background: linear-gradient(135deg, rgba(10, 58, 46, 0.03) 0%, rgba(0, 217, 163, 0.02) 100%);
    border-bottom: 1px solid rgba(0, 217, 163, 0.12);
    margin-bottom: 0;
  }

  .inventory-page-full > .card {
    margin: 0;
    border-radius: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .medicine-image-thumb {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
  }

  .medicine-image-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .medicine-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
  }

  .medicine-image-placeholder svg {
    width: 28px;
    height: 28px;
  }

  .form-image-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .form-image-row input {
    flex: 1;
  }

  .form-image-row .btn {
    white-space: nowrap;
    margin-top: 0;
  }

  .form-image-preview {
    margin-top: 12px;
    width: 120px;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid rgba(0, 217, 163, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
  }

  .form-image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .medicine-catalog-table thead th:nth-child(1) {
    width: 70px;
    text-align: center;
  }

  .medicine-catalog-table tbody td:nth-child(1) {
    text-align: center;
    padding: 8px;
  }

  @media (max-width: 900px) {
    .inventory-page-full > .page-header {
      padding: 20px 16px;
    }
    
    .medicine-image-thumb {
      width: 40px;
      height: 40px;
    }
  }
`;

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toIsoDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `Rs ${n.toFixed(2)}`;
}

function polarToCartesian(cx, cy, r, angleDegrees) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRadians),
    y: cy + r * Math.sin(angleRadians),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'L',
    cx,
    cy,
    'Z',
  ].join(' ');
}

function PieChart({ data }) {
  const size = 180;
  const radius = 78;
  const cx = size / 2;
  const cy = size / 2;

  const total = data.reduce((sum, s) => sum + Number(s.value || 0), 0);
  if (!total) {
    return <p className="empty">No data for pie chart.</p>;
  }

  const colors = [
    'var(--primary)',
    'var(--secondary)',
    'var(--warning)',
    'var(--danger)',
    'var(--accent)',
    'var(--text-muted)',
  ];

  let currentAngle = 0;
  const slices = data.map((slice, idx) => {
    const value = Number(slice.value || 0);
    const angle = (value / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    return {
      ...slice,
      path: describeArc(cx, cy, radius, start, end),
      color: colors[idx % colors.length],
      percent: (value / total) * 100,
    };
  });

  return (
    <div className="chart-pie">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
        {slices.map((s) => (
          <path key={s.name} d={s.path} style={{ fill: s.color }} />
        ))}
      </svg>

      <div className="chart-legend">
        {slices.map((s) => (
          <div key={s.name} className="legend-row">
            <span className="legend-dot" style={{ background: s.color }} aria-hidden="true" />
            <span className="legend-name">{s.name}</span>
            <span className="legend-value">{s.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value || 0)));
  if (!data.length) {
    return <p className="empty">No data for bar chart.</p>;
  }

  return (
    <div className="chart-bars">
      {data.map((d) => {
        const value = Number(d.value || 0);
        const pct = Math.max(0, Math.min(100, (value / max) * 100));
        return (
          <div key={d.name} className="bar-row">
            <div className="bar-label" title={d.name}>{d.name}</div>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="bar-value">{value}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function MedicinesPage() {
  const chartsRef = useRef(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingCharts, setDownloadingCharts] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    price: '',
    quantity: '',
    expiryDate: '',
    description: '',
    imageUrl: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

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
      imageUrl: '',
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
        imageUrl: form.imageUrl || undefined,
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
      imageUrl: m.imageUrl || '',
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
  const getStockBadge = (qty) => {
    const value = Number(qty || 0);
    if (value <= 0) return { label: 'Out of Stock', className: 'status-danger' };
    if (value <= 5) return { label: 'Low Stock', className: 'status-warning' };
    return { label: 'In Stock', className: 'status-success' };
  };

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return { label: 'No Expiry', className: 'status-muted' };
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 30);
    const value = new Date(expiryDate);
    if (Number.isNaN(value.getTime())) return { label: 'Unknown', className: 'status-muted' };
    if (value < now) return { label: 'Expired', className: 'status-danger' };
    if (value <= soon) return { label: 'Expiring Soon', className: 'status-warning' };
    return { label: 'Fresh', className: 'status-success' };
  };

  const analysis = useMemo(() => {
    const list = Array.isArray(medicines) ? medicines : [];
    const totalItems = list.length;
    const totalQuantity = list.reduce((sum, m) => sum + Number(m?.quantity || 0), 0);
    const totalStockValue = list.reduce(
      (sum, m) => sum + Number(m?.price || 0) * Number(m?.quantity || 0),
      0
    );

    const lowStockThreshold = 5;
    const lowStockCount = list.filter((m) => Number(m?.quantity || 0) <= lowStockThreshold).length;

    const now = new Date();
    const expiringSoonDays = 30;
    const soon = new Date(now);
    soon.setDate(soon.getDate() + expiringSoonDays);

    const expiredCount = list.filter((m) => {
      if (!m?.expiryDate) return false;
      const d = new Date(m.expiryDate);
      return !Number.isNaN(d.getTime()) && d < now;
    }).length;

    const expiringSoonCount = list.filter((m) => {
      if (!m?.expiryDate) return false;
      const d = new Date(m.expiryDate);
      return !Number.isNaN(d.getTime()) && d >= now && d <= soon;
    }).length;

    const topByQty = [...list]
      .sort((a, b) => Number(b?.quantity || 0) - Number(a?.quantity || 0))
      .slice(0, 10)
      .map((m) => ({ name: String(m?.name || 'Unknown'), value: Number(m?.quantity || 0) }));

    const makerTotals = new Map();
    for (const m of list) {
      const maker = String(m?.manufacturer || 'Unknown').trim() || 'Unknown';
      const qty = Number(m?.quantity || 0);
      makerTotals.set(maker, (makerTotals.get(maker) || 0) + qty);
    }

    const makers = [...makerTotals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const topMakers = makers.slice(0, 5);
    const otherTotal = makers.slice(5).reduce((sum, m) => sum + m.value, 0);
    const makerPie = otherTotal > 0 ? [...topMakers, { name: 'Others', value: otherTotal }] : topMakers;

    return {
      totalItems,
      totalQuantity,
      totalStockValue,
      lowStockCount,
      expiredCount,
      expiringSoonCount,
      topByQty,
      makerPie,
    };
  }, [medicines]);

  const uniqueManufacturers = useMemo(() => {
    const values = new Set(
      medicines
        .map((m) => String(m?.manufacturer || '').trim())
        .filter(Boolean)
    );
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 30);
    const keyword = searchTerm.trim().toLowerCase();

    const list = medicines.filter((m) => {
      const name = String(m?.name || '').toLowerCase();
      const manufacturer = String(m?.manufacturer || '').toLowerCase();
      const description = String(m?.description || '').toLowerCase();
      const quantity = Number(m?.quantity || 0);
      const expiryDate = m?.expiryDate ? new Date(m.expiryDate) : null;
      const isExpired = expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate < now;
      const expiringSoon = expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate >= now && expiryDate <= soon;

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        manufacturer.includes(keyword) ||
        description.includes(keyword);

      const matchesManufacturer =
        manufacturerFilter === 'all' ||
        String(m?.manufacturer || '').trim() === manufacturerFilter;

      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = quantity <= 5;
      if (stockFilter === 'good') matchesStock = quantity > 5;
      if (stockFilter === 'expired') matchesStock = Boolean(isExpired);
      if (stockFilter === 'expiring') matchesStock = Boolean(expiringSoon);

      return matchesSearch && matchesManufacturer && matchesStock;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'name-asc') return String(a?.name || '').localeCompare(String(b?.name || ''));
      if (sortBy === 'name-desc') return String(b?.name || '').localeCompare(String(a?.name || ''));
      if (sortBy === 'qty-high') return Number(b?.quantity || 0) - Number(a?.quantity || 0);
      if (sortBy === 'qty-low') return Number(a?.quantity || 0) - Number(b?.quantity || 0);
      if (sortBy === 'price-high') return Number(b?.price || 0) - Number(a?.price || 0);
      if (sortBy === 'price-low') return Number(a?.price || 0) - Number(b?.price || 0);
      if (sortBy === 'expiry-soon') {
        const aTime = a?.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b?.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      }
      return 0;
    });

    return sorted;
  }, [manufacturerFilter, medicines, searchTerm, sortBy, stockFilter]);

  const lowStockItems = useMemo(
    () => [...medicines].filter((m) => Number(m?.quantity || 0) <= 5).sort((a, b) => Number(a?.quantity || 0) - Number(b?.quantity || 0)).slice(0, 4),
    [medicines]
  );

  const expiringSoonItems = useMemo(() => {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 30);
    return [...medicines]
      .filter((m) => {
        if (!m?.expiryDate) return false;
        const d = new Date(m.expiryDate);
        return !Number.isNaN(d.getTime()) && d >= now && d <= soon;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      .slice(0, 4);
  }, [medicines]);

  const getGoogleImagesUrl = (medicineName) => {
    return `https://www.google.com/search?q=${encodeURIComponent(medicineName + ' medicine')}&tbm=isch`;
  };

  const handleDownloadReport = async () => {
    try {
      setError(null);
      const data = await medicinesApi.getAll();
      const medicinesList = Array.isArray(data) ? data : [];

      if (medicinesList.length === 0) {
        setError('No medicines to export.');
        return;
      }

      const headers = [
        'name',
        'manufacturer',
        'price',
        'quantity',
        'expiryDate',
        'description',
      ];

      const lines = [headers.join(',')];
      for (const m of medicinesList) {
        const row = [
          m?.name,
          m?.manufacturer,
          m?.price,
          m?.quantity,
          toIsoDate(m?.expiryDate),
          m?.description,
        ].map(toCsvValue);
        lines.push(row.join(','));
      }

      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const filename = `inventory-report-${yyyy}${mm}${dd}.csv`;

      const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download report');
    }
  };

  const handleDownloadCharts = async () => {
    if (!chartsRef.current) return;
    try {
      setError(null);
      setDownloadingCharts(true);

      const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#ffffff';
      const canvas = await html2canvas(chartsRef.current, {
        backgroundColor: cardBg.trim() || '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const filename = `inventory-charts-${yyyy}${mm}${dd}.png`;

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message || 'Failed to download charts');
    } finally {
      setDownloadingCharts(false);
    }
  };

  return (
    <>
      <style>{medicinePageStyles}</style>
      <div className="page inventory-page inventory-page-full">
      <div className="page-header">
        <div>
          <h1>Medicines</h1>
          <p className="page-subtitle">Manage inventory, pricing, quantities, and expiry dates.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleDownloadReport}>
            Download Report
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadCharts} disabled={downloadingCharts}>
            {downloadingCharts ? 'Downloading...' : 'Download Charts'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setForm({ name: '', manufacturer: '', price: '', quantity: '', expiryDate: '', description: '', imageUrl: '' });
            }}
          >
            Add Medicine
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card inventory-toolbar">
        <div className="inventory-toolbar-row">
          <div className="inventory-search">
            <label htmlFor="medicine-search">Search medicines</label>
            <input
              id="medicine-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, manufacturer, or description"
            />
          </div>
          <div className="inventory-filter-grid">
            <div>
              <label htmlFor="stock-filter">Stock Filter</label>
              <select id="stock-filter" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option value="all">All stock levels</option>
                <option value="low">Low stock (≤ 5)</option>
                <option value="good">Healthy stock (&gt; 5)</option>
                <option value="expiring">Expiring in 30 days</option>
                <option value="expired">Expired only</option>
              </select>
            </div>
            <div>
              <label htmlFor="maker-filter">Manufacturer</label>
              <select id="maker-filter" value={manufacturerFilter} onChange={(e) => setManufacturerFilter(e.target.value)}>
                {uniqueManufacturers.map((m) => (
                  <option key={m} value={m}>
                    {m === 'all' ? 'All manufacturers' : m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sort-by">Sort By</label>
              <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name-asc">Name (A - Z)</option>
                <option value="name-desc">Name (Z - A)</option>
                <option value="qty-high">Quantity (high to low)</option>
                <option value="qty-low">Quantity (low to high)</option>
                <option value="price-high">Price (high to low)</option>
                <option value="price-low">Price (low to high)</option>
                <option value="expiry-soon">Expiry (soonest first)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="inventory-toolbar-foot">
          <span>
            Showing <strong>{filteredMedicines.length}</strong> of <strong>{medicines.length}</strong> medicines
          </span>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStockFilter('all');
              setManufacturerFilter('all');
              setSortBy('name-asc');
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="card" ref={chartsRef}>
        <h2>Inventory Analysis</h2>
        <div className="analysis-grid">
          <div className="analysis-stat">
            <div className="analysis-value">{analysis.totalItems}</div>
            <div className="analysis-label">Total Medicines</div>
          </div>
          <div className="analysis-stat">
            <div className="analysis-value">{analysis.totalQuantity}</div>
            <div className="analysis-label">Total Quantity</div>
          </div>
          <div className="analysis-stat">
            <div className="analysis-value">{formatMoney(analysis.totalStockValue)}</div>
            <div className="analysis-label">Estimated Stock Value</div>
          </div>
          <div className="analysis-stat">
            <div className="analysis-value">{analysis.lowStockCount}</div>
            <div className="analysis-label">Low Stock (≤ 5)</div>
          </div>
          <div className="analysis-stat">
            <div className="analysis-value">{analysis.expiredCount}</div>
            <div className="analysis-label">Expired</div>
          </div>
          <div className="analysis-stat">
            <div className="analysis-value">{analysis.expiringSoonCount}</div>
            <div className="analysis-label">Expiring in 30 days</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">Top Medicines by Quantity</h3>
            <BarChart data={analysis.topByQty} />
          </div>
          <div className="chart-card">
            <h3 className="chart-title">Stock Share by Manufacturer</h3>
            <PieChart data={analysis.makerPie} />
          </div>
        </div>
      </div>

      <div className="inventory-insights-grid">
        <div className="card inventory-insight-card">
          <h3>Low Stock Attention</h3>
          {lowStockItems.length === 0 ? (
            <p className="empty">No low-stock items right now.</p>
          ) : (
            <ul className="insight-list">
              {lowStockItems.map((item) => (
                <li key={item._id}>
                  <span>{item.name}</span>
                  <strong>{item.quantity} left</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card inventory-insight-card">
          <h3>Expiring Soon (30 days)</h3>
          {expiringSoonItems.length === 0 ? (
            <p className="empty">No medicines expiring in the next 30 days.</p>
          ) : (
            <ul className="insight-list">
              {expiringSoonItems.map((item) => (
                <li key={item._id}>
                  <span>{item.name}</span>
                  <strong>{formatDate(item.expiryDate)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
            <div className="form-row">
              <label>Image URL</label>
              <div className="form-image-row">
                <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Paste Google Images URL or medicine image link" />
                <a href={getGoogleImagesUrl(form.name)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" title="Search Google Images">
                  🔍 Search Images
                </a>
              </div>
              {form.imageUrl && (
                <div className="form-image-preview">
                  <img src={form.imageUrl} alt="Medicine preview" onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2212%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage Error%3C/text%3E%3C/svg%3E'; }} />
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-card">
        <div className="inventory-table-head">
          <h2>Medicine Catalog</h2>
          <p>View all medicines with product images, stock levels, expiry dates, and quick actions.</p>
        </div>
        {loading ? (
          <p className="loading">Loading...</p>
        ) : filteredMedicines.length === 0 ? (
          <p className="empty">No medicines match the current filters.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table medicine-catalog-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Manufacturer</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <div className="medicine-image-thumb">
                        {m.imageUrl ? (
                          <img src={m.imageUrl} alt={m.name} onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%228%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'; }} />
                        ) : (
                          <div className="medicine-image-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="medicine-main">
                        <span className="medicine-name">{m.name}</span>
                        <span className={`status-pill ${getStockBadge(m.quantity).className}`}>
                          {getStockBadge(m.quantity).label}
                        </span>
                      </div>
                    </td>
                    <td>{m.manufacturer || '-'}</td>
                    <td>{formatMoney(m.price)}</td>
                    <td>{m.quantity}</td>
                    <td>
                      <div className="expiry-meta">
                        <span>{formatDate(m.expiryDate)}</span>
                        <span className={`status-pill ${getExpiryBadge(m.expiryDate).className}`}>
                          {getExpiryBadge(m.expiryDate).label}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(m)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
