// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiUser, FiLogOut, FiCamera, FiSun, FiMoon, FiBell,
  FiMenu, FiX, FiHome, FiUsers, FiBarChart2, FiHeart,
} from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";
import { API_URL, apiFetch, clearAuth, getUserId, getUser } from "../utils/api";
import { useTheme, getGradientStyle, toggleDarkMode } from "../utils/theme";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDark } = useTheme();
  const [showScanModal, setShowScanModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const userId = getUserId();
  const [avatar, setAvatar] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("selectedAvatar");
    if (saved) setAvatar(saved);
    const onStorage = (e) => { if (e.key === "selectedAvatar") setAvatar(e.newValue); };
    const onAvatarChanged = () => setAvatar(localStorage.getItem("selectedAvatar"));
    window.addEventListener("storage", onStorage);
    window.addEventListener("avatar-changed", onAvatarChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("avatar-changed", onAvatarChanged);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => { document.body.style.overflow = ""; document.body.style.touchAction = ""; };
  }, [sidebarOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`${API_URL}/notifications`);
      if (res.ok) {
        const data = await res.json();
        const notes = data.notifications || [];
        setNotifications(notes);
        setUnreadCount(notes.filter((n) => !n.read).length);
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch(`${API_URL}/notifications/read-all`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("selectedAvatar");
    navigate("/");
  };

  const fetchGroups = async () => {
    try {
      const response = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch {}
  };

  const handleScanClick = () => { fetchGroups(); setShowScanModal(true); };

  const navLinks = [
    { to: "/dashboard", icon: <FiHome size={18} />, label: "Dashboard" },
    { to: "/groups", icon: <FiUsers size={18} />, label: "Groups" },
    { to: "/expenses", icon: <span className="text-base font-bold leading-none">₹</span>, label: "Expenses" },
    { to: "/balances", icon: <FiBarChart2 size={18} />, label: "Balances" },
    { to: "/friends", icon: <FiHeart size={18} />, label: "Friends" },
    { to: "/profile", icon: <FiUser size={18} />, label: "Profile" },
  ];

  const user = getUser();

  // Keep OS status-bar / PWA chrome colour in sync with the selected theme
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && theme.gradFrom) meta.setAttribute('content', theme.gradFrom);
  }, [theme.gradFrom]);

  function NavItem({ to, children }) {
    const [hovered, setHovered] = useState(false);
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className="relative px-3 py-2 rounded-xl font-medium overflow-hidden transition-all duration-200"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="relative z-10 transition-colors duration-200" style={{ color: (hovered || active) ? "white" : undefined }}>
          {children}
        </span>
        <span
          className="absolute inset-0 rounded-xl transition-all duration-200"
          style={{ ...getGradientStyle(theme), opacity: (hovered || active) ? 1 : 0, transform: (hovered || active) ? "scale(1)" : "scale(0.95)" }}
        />
      </Link>
    );
  }

  function NotificationPanel() {
    if (notifications.length === 0) return (
      <div className="px-4 py-8 text-center">
        <FiBell size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-400 dark:text-gray-500 text-sm">No reminders yet</p>
      </div>
    );
    return (
      <div className="divide-y dark:divide-gray-700">
        {notifications.map((n) => (
          <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? "opacity-50" : "bg-blue-50/40 dark:bg-blue-900/10"}`}>
            <p className="text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              From {n.from?.name || "Someone"} {"\u00B7"} {new Date(n.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <header className="w-full sticky top-0 z-40 transition-colors duration-200"
        style={{
          background: isDark
            ? "rgba(15,15,25,0.72)"
            : "rgba(255,255,255,0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.08)",
          boxShadow: isDark
            ? "0 1px 20px rgba(0,0,0,0.35)"
            : "0 1px 20px rgba(0,0,0,0.07)",
        }}
      >

        {/* â”€â”€ Desktop (md+) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="hidden md:flex max-w-6xl mx-auto px-6 h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <img src="/favicon.svg" alt="Smart Split" className="h-9 w-9 rounded-xl shadow-md flex-shrink-0" />
            <span className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">Smart Split</span>
          </Link>

          <div className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300">
            {navLinks.map((l) => <NavItem key={l.to} to={l.to}>{l.label}</NavItem>)}
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={handleScanClick} className="text-white h-9 w-9 rounded-xl shadow hover:shadow-md transition-all duration-200 flex items-center justify-center" title="Scan Receipt" style={getGradientStyle(theme)}>
              <FiCamera size={16} />
            </button>
            <button onClick={toggleDarkMode} className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200" title={isDark ? "Light Mode" : "Dark Mode"}>
              {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
            </button>
            <div className="relative">
              <button
                onClick={() => { setShowNotifications((p) => !p); if (unreadCount > 0) markAllRead(); }}
                className="relative h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <FiBell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={getGradientStyle(theme)}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-white text-sm">Reminders</span>
                    <button onClick={() => setShowNotifications(false)} className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition"><FiX size={10} /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto"><NotificationPanel /></div>
                </div>
              )}
            </div>
            <button onClick={() => navigate("/profile")} className="h-9 flex items-center gap-2 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              {avatar
                ? <img src={avatar} alt="avatar" className="h-6 w-6 rounded-full border-2 border-white shadow-sm" />
                : <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><FiUser size={11} /></div>
              }
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name?.split(" ")[0] || "Profile"}</span>
            </button>
            <button onClick={handleLogout} className="h-9 flex items-center gap-1.5 px-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 text-sm font-medium">
              <FiLogOut size={15} /><span>Logout</span>
            </button>
          </div>
        </div>

        {/* â”€â”€ Mobile header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 gap-3">
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition min-w-0">
            <img src="/favicon.svg" alt="Smart Split" className="h-9 w-9 rounded-xl shadow-md flex-shrink-0" />
            <span className="text-[16px] font-bold text-gray-800 dark:text-white truncate">Smart Split</span>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleScanClick} className="text-white h-9 w-9 rounded-xl shadow flex items-center justify-center" style={getGradientStyle(theme)} title="Scan Receipt">
              <FiCamera size={16} />
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-shrink-0"
              aria-label="Open menu"
            >
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* â”€â”€ Mobile Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${sidebarOpen ? "visible" : "invisible pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Drawer from left */}
        <div className={`absolute top-0 left-0 h-full w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-r border-white/30 dark:border-gray-700/50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="Smart Split" className="h-8 w-8 rounded-xl shadow flex-shrink-0" />
              <span className="font-bold text-gray-800 dark:text-white">Smart Split</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <FiX size={17} />
            </button>
          </div>

          {/* Profile card */}
          <div className="mx-3 mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 flex items-center gap-4 flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-14 w-14 rounded-full border-2 shadow-md flex-shrink-0" style={{ borderColor: theme.gradFrom }} />
            ) : (
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md flex-shrink-0" style={getGradientStyle(theme, "to bottom right")}>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-gray-800 dark:text-white text-base truncate">{user?.name || "User"}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 truncate mt-0.5">{user?.email || ""}</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 pt-3 space-y-0.5">
            {navLinks.map(({ to, icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 text-base font-medium ${active ? "text-white shadow-md" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  style={active ? getGradientStyle(theme) : {}}
                >
                  <span className={active ? "text-white/90" : theme.text}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="px-3 pt-2 pb-6 border-t border-gray-100 dark:border-gray-800 space-y-0.5 flex-shrink-0">
            <button
              onClick={() => { setShowNotifications((p) => !p); if (unreadCount > 0) markAllRead(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-[15px] font-medium"
            >
              <span className="relative flex-shrink-0">
                <FiBell size={18} className={theme.text} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={getGradientStyle(theme)}>{unreadCount}</span>
                )}
              </span>
              <span>Notifications</span>
              {unreadCount > 0 && <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={getGradientStyle(theme)}>{unreadCount} new</span>}
            </button>
            {showNotifications && (
              <div className="mx-1 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                <div className="max-h-52 overflow-y-auto"><NotificationPanel /></div>
              </div>
            )}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-[15px] font-medium"
            >
              {isDark
                ? <FiSun size={18} className="text-yellow-400 flex-shrink-0" />
                : <FiMoon size={18} className={`${theme.text} flex-shrink-0`} />
              }
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 text-[15px] font-medium"
            >
              <FiLogOut size={18} className="flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scan Receipt Modal */}
      {showScanModal && (
        <ScanReceipt
          groups={groups}
          userId={userId}
          onExpenseCreated={() => { setShowScanModal(false); navigate("/expenses"); }}
          onClose={() => setShowScanModal(false)}
        />
      )}
    </>
  );
}

