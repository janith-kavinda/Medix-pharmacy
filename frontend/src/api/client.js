const API_BASE = 'http://localhost:5000/api';

async function requestFile(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    throw new Error(data?.error || data?.message || res.statusText || 'Request failed');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || 'report.csv');
  return { blob, filename };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  const res = await fetch(url, config);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    throw new Error(data?.error || data?.message || res.statusText || 'Request failed');
  }
  if (!text) return null;
  return data;
}

export const medicinesApi = {
  getAll: () => request('/medicines'),
  getById: (id) => request(`/medicines/${id}`),
  create: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),
  downloadReport: (format = 'csv') => requestFile(`/medicines/report?format=${encodeURIComponent(format)}`),
};

export const ordersApi = {
  getAll: () => request('/orders'),
  getById: (id) => request(`/orders/${id}`),
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};

export const billingsApi = {
  getAll: () => request('/billings'),
  getById: (id) => request(`/billings/${id}`),
  create: (data) => request('/billings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/billings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/billings/${id}`, { method: 'DELETE' }),
  markPaid: (id) => request(`/billings/${id}/mark-paid`, { method: 'POST' }),
};

export const usersApi = {
  signup: (data) => request('/users/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/users/login', { method: 'POST', body: JSON.stringify(data) }),
  adminLogin: (data) => request('/users/admin-login', { method: 'POST', body: JSON.stringify(data) }),
  adminSignup: (data) => request('/users/admin-signup', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => request('/users'),
  getById: (id) => request(`/users/${id}`),
  update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

