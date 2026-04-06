/**
 * notificationsStore — module-level singleton so all components share one SSE
 * connection and one set of state instead of each opening their own stream.
 *
 * Usage:
 *   import { useNotifications, markAllNotificationsRead } from '../utils/notificationsStore';
 *   const { notifications, unreadCount, markAllRead } = useNotifications();
 */
import { useState, useEffect } from 'react';
import { API_URL, apiFetch, getToken } from './api';

// ── Module-level shared state ──────────────────────────────────────────────
let _subs = new Set();
let _state = { notifications: [], unreadCount: 0 };
let _es = null;
let _poll = null;

function _broadcast() {
  const snap = { ..._state };
  _subs.forEach(fn => fn(snap));
}

async function _fetch() {
  try {
    const res = await apiFetch(`${API_URL}/notifications`);
    if (!res.ok) return;
    const { notifications = [] } = await res.json();
    _state = { notifications, unreadCount: notifications.filter(n => !n.read).length };
    _broadcast();
  } catch { /* network error — silently ignore */ }
}

function _start() {
  if (_es || _poll) return; // already running, don't open a second connection
  _fetch();
  const token = getToken();
  if (token && typeof EventSource !== 'undefined') {
    _es = new EventSource(`${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`);
    _es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'notification' && data.notification) {
          _state = {
            notifications: [data.notification, ..._state.notifications].slice(0, 50),
            unreadCount: _state.unreadCount + 1,
          };
          _broadcast();
        }
      } catch { /* malformed message — ignore */ }
    };
    _es.onerror = () => {
      if (_es) { _es.close(); _es = null; }
      if (!_poll) _poll = setInterval(_fetch, 60_000);
    };
  } else {
    _poll = setInterval(_fetch, 60_000);
  }
}

function _stop() {
  if (_es) { _es.close(); _es = null; }
  if (_poll) { clearInterval(_poll); _poll = null; }
  _state = { notifications: [], unreadCount: 0 };
  _broadcast();
}

// Reset on logout so stale notifications don't show on next login
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', _stop);
}

// ── Public API ─────────────────────────────────────────────────────────────
export async function markAllNotificationsRead() {
  try {
    await apiFetch(`${API_URL}/notifications/read-all`, { method: 'PATCH' });
    _state = {
      notifications: _state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    };
    _broadcast();
  } catch { /* ignore */ }
}

/**
 * React hook — subscribe to the shared notification store.
 * First consumer starts the SSE; all consumers share the same stream.
 */
export function useNotifications() {
  const [state, setLocalState] = useState(_state);

  useEffect(() => {
    // Subscribe
    _subs.add(setLocalState);
    // Sync current state immediately (in case SSE already delivered data)
    setLocalState({ ..._state });
    // Start SSE/polling if not already running (no-op on subsequent calls)
    const userId = localStorage.getItem('userId');
    if (userId) _start();

    return () => {
      _subs.delete(setLocalState);
      // Keep SSE alive while any subscriber exists — don't stop on unmount
      // (components re-mount on navigation; stopping/restarting each time
      //  is exactly the duplicate-connection problem we're solving)
    };
  }, []);

  return { ...state, markAllRead: markAllNotificationsRead };
}
