import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome, FiUsers, FiBarChart2, FiHeart,
  FiSun, FiMoon, FiBell, FiX, FiCamera, FiLogOut,
} from "react-icons/fi";
import { useTheme, getGradientStyle, toggleDarkMode } from "../utils/theme";
import { API_URL, apiFetch, clearAuth, getUserId, getUser } from "../utils/api";
import { useNotifications } from "../utils/notificationsStore";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const notifPanelRef = useRef(null);

  // Shared notifications store — no duplicate SSE connections
  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    const saved = localStorage.getItem("selectedAvatar");
    if (saved) setAvatar(saved);
    else { const pfp = getUser()?.pfp; if (pfp) setAvatar(pfp); }
    const onAvatarChanged = () => setAvatar(localStorage.getItem("selectedAvatar"));
    window.addEventListener("avatar-changed", onAvatarChanged);
    window.addEventListener("storage", onAvatarChanged);
    return () => { window.removeEventListener("avatar-changed", onAvatarChanged); window.removeEventListener("storage", onAvatarChanged); };
  }, []);

  // Close notifications panel on route change
  useEffect(() => { setShowNotifications(false); }, [location.pathname]);

  // Close notifications panel when clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications]);

  const handleLogout = () => { clearAuth(); localStorage.removeItem("selectedAvatar"); sessionStorage.clear(); navigate("/", { replace: true }); };
  const handleScanClick = async () => {
    try { const r = await apiFetch(`${API_URL}/groups?userId=${userId}`); if (r.ok) { const d = await r.json(); setGroups(d.groups || []); } } catch {}
    setShowScanModal(true);
  };

  // Allow the right panel to trigger scan via custom event
  useEffect(() => {
    const handler = () => handleScanClick();
    window.addEventListener("open-scan-receipt", handler);
    return () => window.removeEventListener("open-scan-receipt", handler);
  }, []);

  const navLinks = [
    { to: "/dashboard", icon: <FiHome size={18} />, label: "Dashboard" },
    { to: "/groups", icon: <FiUsers size={18} />, label: "Groups" },
    { to: "/expenses", icon: <span className="text-xl font-extrabold leading-none">₹</span>, label: "Expenses" },
    { to: "/balances", icon: <FiBarChart2 size={18} />, label: "Balances" },
    { to: "/friends", icon: <FiHeart size={18} />, label: "Friends" },
  ];

  const glass = isDark
    ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
    : { background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" };

  const pillStyle = {
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.92)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.07)",
    boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.08)",
  };

  // SIDEBAR: logo pops in first → both pills emerge from it
  return (
    <>
      <aside
        className="sticky top-0 flex flex-col items-center sidebar-scroll"
        style={{ width: 52, height: "100vh", margin: "0 8px", paddingTop: 120, paddingBottom: 32 }}
      >
        {/* ── Both pills — top anchored, bottom anchored ── */}
        <div className="flex flex-col items-center gap-8 flex-1 justify-between w-full">

        {/* ── TOP PILL: Nav + Camera — scaleY from top ── */}
        <motion.div
          className="flex flex-col items-center w-full rounded-[20px] py-2"
          style={{ ...pillStyle, transformOrigin: "top center" }}
          initial={{ opacity: 0, scaleY: 0.04 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.38 }}
        >
          {/* Main navigation — staggered pill-nav entry */}
          <nav className="flex flex-col items-center gap-0.5 w-full px-2 mb-2 mt-1">
            {navLinks.map((l, idx) => {
              const active = location.pathname === l.to;
              return (
                <motion.div
                  key={l.to}
                  className="w-full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.52 + idx * 0.06, type: "spring", stiffness: 340, damping: 28 }}
                >
                  <Link
                    to={l.to}
                    title={l.label}
                    className="w-full flex flex-col items-center gap-0.5 py-2.5 rounded-xl relative overflow-hidden"
                    style={{ color: active ? "#fff" : isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.42)" }}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`,
                          boxShadow: `0 4px 18px ${theme.gradFrom}44`,
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{l.icon}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Camera tool */}
          <motion.div
            className="w-full px-2 pb-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.52 + 5 * 0.06, type: "spring", stiffness: 340, damping: 28 }}
          >
            <button
              onClick={handleScanClick}
              title="Scan Receipt"
              className="w-full flex flex-col items-center gap-0.5 py-2.5 rounded-xl relative overflow-hidden group/tool"
              style={glass}
            >
              <div className="absolute inset-0 opacity-0 group-hover/tool:opacity-100 transition-opacity rounded-xl"
                style={{ background: `radial-gradient(circle at 50% 0%, ${theme.gradFrom}30 0%, transparent 70%)` }} />
              <FiCamera size={16} className="relative z-10" style={{ color: theme.gradFrom }} />
            </button>
          </motion.div>
        </motion.div>

        {/* ── BOTTOM PILL: Theme + Notifs + Profile + Logout — scaleY from bottom ── */}
        <motion.div
          className="flex flex-col items-center w-full rounded-[20px] py-2 gap-1.5"
          style={{ ...pillStyle, transformOrigin: "bottom center" }}
          initial={{ opacity: 0, scaleY: 0.04 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.46 }}
        >
          {/* Goals mini indicator */}
          {goals.length > 0 && (
            <div className="w-full px-3 mb-0.5">
              <div className="h-1.5 rounded-full overflow-hidden mb-0.5" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(100, goals.reduce((a, g) => a + (g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0), 0) / goals.length)}%` }}
                  transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.5 }}
                  style={{ background: `linear-gradient(to right, ${theme.gradFrom}, ${theme.gradTo})` }}
                />
              </div>
              <p className="text-[8px] text-center font-bold" style={{ color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)" }}>Goals</p>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDark ? "Light Mode" : "Dark Mode"}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: isDark ? "#fbbf24" : "#6366f1" }}
          >
            {isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications((p) => !p); if (unreadCount > 0) markAllRead(); }}
              className="relative h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.48)",
              }}
            >
              <motion.div
                animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, -4, 4, 0] } : { rotate: 0 }}
                transition={{ duration: 0.6, delay: 1.5, repeat: Infinity, repeatDelay: 8 }}
              >
                <FiBell size={14} />
              </motion.div>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {showNotifications && (
              <div
                ref={notifPanelRef}
                className="absolute left-full ml-3 bottom-0 w-64 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{
                  background: isDark ? "rgba(8,10,22,0.97)" : "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.65)" : "0 20px 60px rgba(0,0,0,0.12)",
                  maxHeight: "calc(100vh - 180px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px]" style={{ color: isDark ? "#fff" : "#111" }}>Reminders</span>
                    {unreadCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
                    className="h-6 w-6 rounded-full flex items-center justify-center transition hover:scale-110"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}
                  >
                    <FiX size={10} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto sidebar-scroll">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                        style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                        <FiBell size={18} style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" }} />
                      </div>
                      <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>No reminders yet</p>
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id || n._id} className="px-4 py-3"
                      style={{
                        borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)",
                        background: n.read ? "transparent" : isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)",
                      }}>
                      <p className="text-[12px] leading-snug" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)" }}>{n.message}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)" }}>From {n.from?.name || "Someone"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile — navigates to /profile page */}
          <button
            onClick={() => navigate("/profile")}
            title="Profile"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-8 w-8 rounded-xl object-cover" style={{ border: `2px solid ${theme.gradFrom}55` }} />
            ) : (
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}>
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 mb-1"
            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.38)" }}
          >
            <FiLogOut size={14} />
          </button>
        </motion.div>

        </div>{/* end centered pills wrapper */}
      </aside>

      {showScanModal && (
        <ScanReceipt groups={groups} onClose={() => setShowScanModal(false)} />
      )}
    </>
  );
}
