export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function setAuthToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
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

