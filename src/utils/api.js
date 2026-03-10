export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Check both storages; localStorage wins (means "remember me" was checked)
function _storage() {
  return localStorage.getItem('token') ? localStorage : sessionStorage;
}

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getUserId() {
  return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

export function getUser() {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

/** Called after login/signup. remember=true → localStorage, false → sessionStorage */
export function setAuthData(token, user, userId, remember) {
  const keep = remember ? localStorage : sessionStorage;
  const drop = remember ? sessionStorage : localStorage;
  ['token', 'user', 'userId'].forEach(k => drop.removeItem(k));
  keep.setItem('token', token);
  keep.setItem('user', JSON.stringify(user));
  keep.setItem('userId', userId);
}

/** Clear auth from both storages (used on logout) */
export function clearAuth() {
  ['token', 'user', 'userId'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

/** @deprecated use setAuthData instead */
export function setAuthToken(token) {
  if (token) _storage().setItem('token', token);
  else { localStorage.removeItem('token'); sessionStorage.removeItem('token'); }
}

export function apiFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

// Convenience wrapper used by the API objects below
async function apiCall(endpoint, options = {}) {
  try {
    const response = await apiFetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API request failed');
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Auth APIs
export const authAPI = {
  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (email, password, name) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
};

// Group APIs
export const groupAPI = {
  getGroups: (userId) => apiCall(`/groups?userId=${userId}`),
  getGroup: (groupId) => apiCall(`/groups/${groupId}`),
  createGroup: (name, description, createdBy) =>
    apiCall('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description, createdBy }),
    }),
  addMembers: (groupId, memberIds) =>
    apiCall(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberIds }),
    }),
};

// Expense APIs
export const expenseAPI = {
  getExpenses: (groupId) => apiCall(`/expenses/group/${groupId}`),
  getBalances: (groupId) => apiCall(`/expenses/group/${groupId}/balances`),
  getSettlements: (groupId) => apiCall(`/expenses/group/${groupId}/settlements`),
  addExpense: (groupId, expenseData) =>
    apiCall(`/expenses/group/${groupId}`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),
  settleExpense: (expenseId, settledBy, amount) =>
    apiCall(`/expenses/${expenseId}/settle`, {
      method: 'POST',
      body: JSON.stringify({ settledBy, amount }),
    }),
};

export default { authAPI, groupAPI, expenseAPI };

