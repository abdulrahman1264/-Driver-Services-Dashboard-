const BASE = 'https://driver-services-dashboard.onrender.com/api';

function getToken() {
  return localStorage.getItem('ds_token');
}

async function req(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('ds_token');
    localStorage.removeItem('ds_user');
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login:          (u, p)      => req('/auth/login', { method: 'POST', body: { username: u, password: p } }),
  getDrivers:     (params={}) => req('/drivers?' + new URLSearchParams(params)),
  getDriver:      (id)        => req(`/drivers/${id}`),
  addDriver:      (data)      => req('/drivers', { method: 'POST', body: data }),
  updateDriver: (id, data) => req(`/drivers/${id}`, { method: 'PUT', body: data }),
  deleteDriver: (id)       => req(`/drivers/${id}`, { method: 'DELETE' }),
  getRecruitment: (params={}) => req('/recruitment?' + new URLSearchParams(params)),
  getAnalytics:   ()          => req('/analytics'),
  uploadCSV:      (type, csvData) => req('/upload/csv', { method: 'POST', body: { type, csvData } }),
  getUsers:       ()          => req('/users'),
  addUser:        (data)      => req('/users', { method: 'POST', body: data }),
  deleteUser:     (id)        => req(`/users/${id}`, { method: 'DELETE' }),
};