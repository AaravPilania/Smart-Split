export const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  // Notify App so BottomNav and other auth-dependent UI re-renders
  window.dispatchEvent(new Event('auth:login'));
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
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (default)
const CACHE_TTL_LONG = 60 * 60 * 1000; // 1 hour (stable data)

// Keys that use the longer TTL (friends, subscriptions, goals, notifications)
const LONG_TTL_PREFIXES = ['friends_', 'subscriptions_', 'goals_', 'notifications_', 'friend_requests_'];

function getTTL(key) {
  return LONG_TTL_PREFIXES.some(p => key.startsWith(p)) ? CACHE_TTL_LONG : CACHE_TTL;
}

/** Returns cached data for a GET endpoint, or null if stale/missing */
export function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > getTTL(key)) return null;
    return data;
  } catch { return null; }
}

/** Store data in local cache */
export function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded — ignore */ }
}

/* ─── IndexedDB cache layer for large data ────────────────── */
const IDB_NAME = 'smartsplit_cache';
const IDB_STORE = 'data';
const IDB_VERSION = 1;

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getIDBCached(key) {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);
        const ttl = LONG_TTL_PREFIXES.some(p => key.startsWith(p)) ? CACHE_TTL_LONG : CACHE_TTL;
        if (Date.now() - entry.ts > ttl) return resolve(null);
        resolve(entry.data);
      };
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function setIDBCache(key, data) {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ ts: Date.now(), data }, key);
  } catch { /* ignore */ }
}

/**
 * Remove one or more cache entries by exact key or key prefix.
 * Pass a prefix ending with '_' to wipe all related keys.
 * e.g. invalidateCache('groups_') removes groups_{userId} for all users.
 */
export function invalidateCache(...keys) {
  try {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(key => {
      const full = CACHE_PREFIX + key;
      allKeys.forEach(k => {
        if (k === full || k.startsWith(full)) localStorage.removeItem(k);
      });
    });
  } catch { /* ignore */ }
}

/**
 * Fetch with cache-first strategy.
 * - Returns cached data immediately if fresh (< 5 min old).
 * - Always fires a background network request to refresh the cache.
 * - When fresh data arrives, calls onFresh(data) so the UI can update.
 *
 * @param {string} url       - API URL
 * @param {string} cacheKey  - Unique cache key
 * @param {function} onFresh - Called with fresh data when background fetch succeeds
 * @returns {Promise<Response>} Resolves with cached Response immediately, or network Response if no cache
 */
export async function cachedApiFetch(url, cacheKey, onFresh) {
  const networkPromise = apiFetch(url);
  
  // Try localStorage first (fast sync)
  let cached = getCached(cacheKey);
  
  // If no localStorage cache, try IndexedDB (async but still faster than network)
  if (!cached) {
    cached = await getIDBCached(cacheKey);
  }

  if (cached) {
    networkPromise.then(async (res) => {
      if (res.ok) {
        const data = await res.clone().json();
        setCache(cacheKey, data);
        setIDBCache(cacheKey, data).catch(() => {});
        if (onFresh) onFresh(data);
      }
    }).catch(() => {});
    return new Response(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const res = await networkPromise;
  if (res.ok) {
    const data = await res.clone().json();
    setCache(cacheKey, data);
    setIDBCache(cacheKey, data).catch(() => {});
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

/**
 * Pre-fetch and cache all critical data after login.
 * Fires all requests in parallel for maximum speed.
 */
export async function warmCache(userId) {
  if (!userId) return;
  const endpoints = [
    { url: `${API_URL}/auth/dashboard/summary`, key: `dashboard_summary_${userId}` },
    { url: `${API_URL}/groups?userId=${userId}`, key: `groups_${userId}` },
    { url: `${API_URL}/friends`, key: `friends_${userId}` },
    { url: `${API_URL}/goals`, key: `goals_${userId}` },
    { url: `${API_URL}/subscriptions`, key: `subscriptions_${userId}` },
    { url: `${API_URL}/notifications`, key: `notifications_${userId}` },
  ];

  const results = await Promise.allSettled(
    endpoints.map(async ({ url, key }) => {
      try {
        const res = await apiFetch(url);
        if (res.ok) {
          const data = await res.json();
          setCache(key, data);
          setIDBCache(key, data).catch(() => {});
          return data;
        }
      } catch { /* ignore */ }
    })
  );
  return results;
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

  sendOtp: (email) =>
    apiCall('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  signup: (email, password, name, otp) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, otp }),
    }),

  googleAuth: (access_token) =>
    apiCall('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ access_token }),
    }),

  sendPhoneOtp: (phone) =>
    apiCall('/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyPhoneOtp: (phone, otp) =>
    apiCall('/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
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

