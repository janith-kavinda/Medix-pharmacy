const API_BASE = 'http://localhost:5000/api';

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
  if (!res.ok) throw new Error(res.statusText || 'Request failed');
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const medicinesApi = {
  getAll: () => request('/medicines'),
  getById: (id) => request(`/medicines/${id}`),
  create: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),
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
  create: (data) => request('/billings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/billings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/billings/${id}`, { method: 'DELETE' }),
};
