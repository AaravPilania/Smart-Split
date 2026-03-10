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

/**
 * Pings the backend health endpoint.
 * Returns true if reachable, false otherwise.
 */
export async function pingServer() {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    // 429 = rate-limited but server IS running; treat as alive
    return res.ok || res.status === 429;
  } catch {
    return false;
  }
}

/**
 * Waits for the backend to become reachable — handles Render cold-start.
 * Polls /api/health every 3 seconds for up to 60 seconds.
 * Fires a custom event so the UI can show/hide a "waking up" banner.
 */
export async function wakeUpServer() {
  const alive = await pingServer();
  if (alive) return true;

  window.dispatchEvent(new CustomEvent('server-waking', { detail: { waking: true } }));
  // Poll for up to 2 minutes (40 × 3 s) — Render cold-start can take 60–90 s
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const ok = await pingServer();
    if (ok) {
      window.dispatchEvent(new CustomEvent('server-waking', { detail: { waking: false } }));
      return true;
    }
  }
  window.dispatchEvent(new CustomEvent('server-waking', { detail: { waking: false } }));
  return false;
}

// Convenience wrapper used by the API objects below
async function apiCall(endpoint, options = {}, _retry = 1) {
  try {
    const response = await apiFetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API request failed');
    return data;
  } catch (error) {
    // Network error (server cold-starting) → retry once after 3 s
    if (_retry > 0 && (error instanceof TypeError || error.message === 'Failed to fetch')) {
      await new Promise(r => setTimeout(r, 3000));
      return apiCall(endpoint, options, _retry - 1);
    }
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

