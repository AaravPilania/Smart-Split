import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome, FiUsers, FiBarChart2, FiHeart, FiUser, FiLogOut,
  FiSun, FiMoon, FiBell, FiX, FiCamera, FiTarget,
} from "react-icons/fi";
import { useTheme, getGradientStyle, toggleDarkMode } from "../utils/theme";
import { API_URL, apiFetch, clearAuth, getUserId, getUser, getToken } from "../utils/api";
import ScanReceipt from "./ScanReceipt";

export default function DashboardSidebar({ goals = [], onGoalsNeeded }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDark } = useTheme();
  const userId = getUserId();
  const user = getUser();
  const [avatar, setAvatar] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("selectedAvatar");
    if (saved) setAvatar(saved);
    else { const pfp = getUser()?.pfp; if (pfp) setAvatar(pfp); }
    const onAvatarChanged = () => setAvatar(localStorage.getItem("selectedAvatar"));
    window.addEventListener("avatar-changed", onAvatarChanged);
    window.addEventListener("storage", onAvatarChanged);
    return () => { window.removeEventListener("avatar-changed", onAvatarChanged); window.removeEventListener("storage", onAvatarChanged); };
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const token = getToken();
    let es, fallbackInterval;
    if (token && typeof EventSource !== "undefined") {
      es = new EventSource(`${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "notification" && data.notification) {
            setNotifications((prev) => [data.notification, ...prev].slice(0, 50));
            setUnreadCount((c) => c + 1);
          }
        } catch {}
      };
      es.onerror = () => { es.close(); es = null; if (!fallbackInterval) fallbackInterval = setInterval(fetchNotifications, 60000); };
    } else {
      fallbackInterval = setInterval(fetchNotifications, 60000);
    }
    return () => { if (es) es.close(); if (fallbackInterval) clearInterval(fallbackInterval); };
  }, [userId]);

  useEffect(() => { setShowNotifications(false); }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`${API_URL}/notifications`);
      if (res.ok) { const data = await res.json(); const notes = data.notifications || []; setNotifications(notes); setUnreadCount(notes.filter((n) => !n.read).length); }
    } catch {}
  };

  const markAllRead = async () => {
    try { await apiFetch(`${API_URL}/notifications/read-all`, { method: "PATCH" }); setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); setUnreadCount(0); } catch {}
  };

  const handleLogout = () => { clearAuth(); localStorage.removeItem("selectedAvatar"); sessionStorage.clear(); navigate("/", { replace: true }); };
  const handleScanClick = async () => {
    try { const r = await apiFetch(`${API_URL}/groups?userId=${userId}`); if (r.ok) { const d = await r.json(); setGroups(d.groups || []); } } catch {}
    setShowScanModal(true);
  };

  const navLinks = [
    { to: "/dashboard", icon: <FiHome size={18} />, label: "Dashboard" },
    { to: "/groups", icon: <FiUsers size={18} />, label: "Groups" },
    { to: "/expenses", icon: <span className="text-base font-bold leading-none">₹</span>, label: "Expenses" },
    { to: "/balances", icon: <FiBarChart2 size={18} />, label: "Balances" },
    { to: "/friends", icon: <FiHeart size={18} />, label: "Friends" },
  ];

  const glass = isDark
    ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
    : { background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" };

  return (
    <>
      <aside className="h-screen sticky top-0 flex flex-col py-6 px-5 overflow-y-auto sidebar-scroll"
        style={{
          borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        }}>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 mb-8 hover:opacity-80 transition">
          <img src="/icon.png" alt="Smart Split" className="h-9 w-9 rounded-xl shadow-md flex-shrink-0" />
          <span className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">Smart Split</span>
        </Link>

        {/* Nav links */}
        <nav className="space-y-1 mb-6">
          {navLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-[14px] relative overflow-hidden"
                style={{
                  color: active ? "#fff" : isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
                }}>
                {/* Sliding gradient pill driven by layoutId */}
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-xl"
                    style={getGradientStyle(theme)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <motion.span
                  className="relative z-10 flex items-center gap-3"
                  whileHover={!active ? { x: 3, transition: { type: "spring", stiffness: 400 } } : {}}
                >
                  {l.icon}
                  {l.label}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        {/* Quick actions */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleScanClick}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
              style={glass}>
              <FiCamera size={18} style={{ color: theme.gradFrom }} />
              <span style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>Scan</span>
            </button>
            <button onClick={() => navigate("/balances")}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
              style={glass}>
              <FiBarChart2 size={18} style={{ color: theme.gradTo }} />
              <span style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>Settle</span>
            </button>
          </div>
        </div>

        {/* Goals / Saving Plans */}
        {goals.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                Saving Goals
              </p>
            </div>
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;
                return (
                  <div key={goal.id || goal._id} className="rounded-xl p-3" style={glass}>
                    <div className="flex items-center gap-2 mb-2">
                      <FiTarget size={14} style={{ color: theme.gradFrom }} />
                      <p className="text-xs font-bold truncate" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.75)" }}>
                        {goal.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>
                        ₹{(goal.savedAmount || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.3 }}
                        style={{ background: `linear-gradient(to right, ${theme.gradFrom}, ${theme.gradTo})` }}
                      />
                    </div>
                    <p className="text-[10px] mt-1.5"
                      style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                      Target: ₹{(goal.targetAmount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Utility bar */}
        <div className="flex items-center gap-1.5 mb-4">
          <button onClick={toggleDarkMode}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-white/5 transition"
            title={isDark ? "Light Mode" : "Dark Mode"}>
            {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
          </button>
          <div className="relative">
            <button
              onClick={() => { setShowNotifications((p) => !p); if (unreadCount > 0) markAllRead(); }}
              className="relative h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition">
              <motion.div
                animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, -4, 4, 0] } : { rotate: 0 }}
                transition={{ duration: 0.6, delay: 1.5, repeat: Infinity, repeatDelay: 8 }}
              >
                <FiBell size={17} />
              </motion.div>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={getGradientStyle(theme)}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {showNotifications && (
              <div className="absolute left-0 bottom-full mb-2 w-72 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{
                  background: isDark ? "rgba(12,12,22,0.95)" : "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
                }}>
                <div className="px-4 py-3 border-b flex justify-between items-center"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
                  <span className="font-semibold text-gray-800 dark:text-white text-sm">Reminders</span>
                  <button onClick={() => setShowNotifications(false)}
                    className="h-5 w-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
                    <FiX size={10} />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <FiBell size={22} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-400 dark:text-gray-500 text-xs">No reminders yet</p>
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id || n._id}
                      className={`px-4 py-2.5 text-xs ${n.read ? "opacity-50" : "bg-blue-50/40 dark:bg-blue-900/10"}`}
                      style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)" }}>
                      <p className="text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
                        From {n.from?.name || "Someone"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User card */}
        <div className="rounded-xl p-3 flex items-center gap-3" style={glass}>
          {avatar ? (
            <img src={avatar} alt="avatar" className="h-9 w-9 rounded-xl object-cover flex-shrink-0"
              style={{ border: `2px solid ${theme.gradFrom}44` }} />
          ) : (
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={getGradientStyle(theme)}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: isDark ? "#fff" : "#111" }}>
              {user?.name || "User"}
            </p>
            <p className="text-[11px] truncate" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              {user?.email || ""}
            </p>
          </div>
          <button onClick={handleLogout}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex-shrink-0"
            title="Logout">
            <FiLogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Scan Receipt Modal */}
      {showScanModal && (
        <ScanReceipt groups={groups} onClose={() => setShowScanModal(false)} />
      )}
    </>
  );
}
