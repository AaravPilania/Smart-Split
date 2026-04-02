export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── In-memory access token (never written to localStorage) ──────────────
let _accessToken = null;
let _refreshing = null; // deduplicates concurrent refresh calls

export function getToken() { return _accessToken; }
export function setToken(token) { _accessToken = token || null; }
export function clearToken() { _accessToken = null; }

// Storage helpers for user/userId (NOT for the access token)
export function getUserId() {
  return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

export function getUser() {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

/** Called after login/signup. remember=true → localStorage, false → sessionStorage.
 *  Stores user/userId in storage; access token stays in memory only. */
export function setAuthData(token, user, userId, remember) {
  setToken(token);
  const keep = remember ? localStorage : sessionStorage;
  const drop = remember ? sessionStorage : localStorage;
  ['user', 'userId'].forEach(k => drop.removeItem(k));
  keep.setItem('user', JSON.stringify(user));
  keep.setItem('userId', userId);
}

/** Clear all auth state */
export function clearAuth() {
  clearToken();
  ['user', 'userId'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

/** Attempt a silent token refresh using the httpOnly refresh cookie.
 *  Returns the new access token string, or null on failure. */
export async function silentRefresh() {
  // Deduplicate: if already refreshing, wait for the same promise
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.token) { setToken(data.token); return data.token; }
      return null;
    } catch {
      return null;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
}

export function apiFetch(url, options = {}) {
  const token = _accessToken;
  const { _isRetry, ...fetchOptions } = options;
  return fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  }).then(async (res) => {
    // On 401, try silent refresh once then retry the original request
    if (res.status === 401 && !_isRetry) {
      const newToken = await silentRefresh();
      if (newToken) {
        return apiFetch(url, { ...options, _isRetry: true });
      }
      // Refresh failed — clear state and signal logout
      clearAuth();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return res;
  });
}

/* ─── Local cache layer for faster loads ────────────────────── */
const CACHE_PREFIX = 'ss_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Returns cached data for a GET endpoint, or null if stale/missing */
export function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

/** Store data in local cache */
export function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded — ignore */ }
}

/**
 * Fetch with cache-first strategy.
 * Returns cached data immediately if available, then refreshes in background.
 * @param {string} url - API URL
 * @param {string} cacheKey - Cache key (e.g. 'dashboard_summary')
 * @param {function} onFresh - Callback when fresh data arrives (optional)
 * @returns {Promise<Response>} - The fetch response (from network)
 */
export async function cachedApiFetch(url, cacheKey, onFresh) {
  // Start network fetch immediately
  const networkPromise = apiFetch(url);
  // If we have cached data, return it wrapped in a fake Response
  const cached = getCached(cacheKey);
  if (cached) {
    // Still refresh in background
    networkPromise.then(async (res) => {
      if (res.ok) {
        const data = await res.clone().json();
        setCache(cacheKey, data);
        if (onFresh) onFresh(data);
      }
    }).catch(() => {});
    return new Response(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  // No cache — wait for network
  const res = await networkPromise;
  if (res.ok) {
    const data = await res.clone().json();
    setCache(cacheKey, data);
  }
  return res;
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
  // Poll silently for up to 2 minutes (40 × 3 s) — Render cold-start can take 60–90 s
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    if (await pingServer()) return true;
  }
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

  googleAuth: (access_token) =>
    apiCall('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ access_token }),
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
  updateExpense: (expenseId, body) =>
    apiCall(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  suggestCategory: (title, ocrText = '') =>
    apiCall('/expenses/suggest-category', {
      method: 'POST',
      body: JSON.stringify({ title, ocrText }),
    }),
};

export default { authAPI, groupAPI, expenseAPI };

