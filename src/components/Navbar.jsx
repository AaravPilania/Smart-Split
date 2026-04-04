// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiLogOut,
  FiCamera,
  FiSun,
  FiMoon,
  FiBell,
  FiX,
  FiHome,
  FiUsers,
  FiBarChart2,
  FiHeart,
} from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";
import { API_URL, apiFetch, clearAuth, getUserId, getUser, getToken } from "../utils/api";
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

  useEffect(() => {
    const saved = localStorage.getItem("selectedAvatar");
    if (saved) {
      setAvatar(saved);
    } else {
      const pfp = getUser()?.pfp;
      if (pfp) setAvatar(pfp);
    }
    const onStorage = (e) => {
      if (e.key === "selectedAvatar") setAvatar(e.newValue);
    };
    const onAvatarChanged = () =>
      setAvatar(localStorage.getItem("selectedAvatar"));
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

    // Try SSE for real-time updates, fall back to polling
    const token = getToken();
    let es;
    let fallbackInterval;
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
      es.onerror = () => {
        // SSE failed — close and start polling
        es.close();
        es = null;
        if (!fallbackInterval) fallbackInterval = setInterval(fetchNotifications, 60000);
      };
    } else {
      fallbackInterval = setInterval(fetchNotifications, 60000);
    }
    return () => {
      if (es) es.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [userId]);

  // Close notifications on route change
  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

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
    sessionStorage.clear();
    navigate("/", { replace: true });
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

  const handleScanClick = () => {
    fetchGroups();
    setShowScanModal(true);
  };

  const navLinks = [
    { to: "/dashboard", icon: <FiHome size={18} />, label: "Dashboard" },
    { to: "/groups", icon: <FiUsers size={18} />, label: "Groups" },
    {
      to: "/expenses",
      icon: (
        <span className="text-base font-bold leading-none">₹</span>
      ),
      label: "Expenses",
    },
    { to: "/balances", icon: <FiBarChart2 size={18} />, label: "Balances" },
    { to: "/friends", icon: <FiHeart size={18} />, label: "Friends" },
    { to: "/profile", icon: <FiUser size={18} />, label: "Profile" },
  ];

  const user = getUser();

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
        <span
          className="relative z-10 transition-colors duration-200"
          style={{ color: hovered || active ? "white" : undefined }}
        >
          {children}
        </span>
        <span
          className="absolute inset-0 rounded-xl transition-all duration-200"
          style={{
            ...getGradientStyle(theme),
            opacity: hovered || active ? 1 : 0,
            transform:
              hovered || active ? "scale(1)" : "scale(0.95)",
          }}
        />
      </Link>
    );
  }

  function NotificationPanel() {
    if (notifications.length === 0)
      return (
        <div className="px-4 py-8 text-center">
          <FiBell
            size={28}
            className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
          />
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No reminders yet
          </p>
        </div>
      );
    return (
      <div className="divide-y dark:divide-gray-700">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 text-sm ${
              n.read ? "opacity-50" : "bg-blue-50/40 dark:bg-blue-900/10"
            }`}
          >
            <p className="text-gray-700 dark:text-gray-200 leading-snug">
              {n.message}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              From {n.from?.name || "Someone"} &middot;{" "}
              {new Date(n.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    );
  }

  const sidebarPages = ["/dashboard", "/groups", "/expenses", "/balances", "/friends", "/profile"];
  const isSidebarPage = sidebarPages.includes(location.pathname);

  return (
    <>
      <header
        className={`w-full fixed top-0 z-40 transition-colors duration-200${isSidebarPage ? " md:hidden" : ""}`}
        style={{
          background: isDark
            ? "rgba(15,15,25,0.72)"
            : "rgba(255,255,255,0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: isDark
            ? "0 1px 20px rgba(0,0,0,0.35)"
            : "0 1px 20px rgba(0,0,0,0.07)",
        }}
      >
        {/* ── Desktop (md+) — unchanged ─────────────────────── */}
        <div className="hidden md:flex max-w-6xl mx-auto px-6 h-16 items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 hover:opacity-80 transition"
          >
            <img
              src="/icon.png"
              alt="Smart Split"
              className="h-9 w-9 rounded-xl shadow-md flex-shrink-0"
            />
            <span className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">
              Smart Split
            </span>
          </Link>

          <div className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300">
            {navLinks.map((l) => (
              <NavItem key={l.to} to={l.to}>
                {l.label}
              </NavItem>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleScanClick}
              className="text-white h-9 w-9 rounded-xl shadow hover:shadow-md transition-all duration-200 flex items-center justify-center"
              title="Scan Receipt"
              style={getGradientStyle(theme)}
            >
              <FiCamera size={16} />
            </button>
            <button
              onClick={toggleDarkMode}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((p) => !p);
                  if (unreadCount > 0) markAllRead();
                }}
                className="relative h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <FiBell size={17} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={getGradientStyle(theme)}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{
                    background: isDark
                      ? "rgba(12,12,22,0.88)"
                      : "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(0,0,0,0.07)",
                    boxShadow: isDark
                      ? "0 8px 40px rgba(0,0,0,0.55)"
                      : "0 8px 40px rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    className="px-4 py-3 border-b flex justify-between items-center"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.06)",
                    }}
                  >
                    <span className="font-semibold text-gray-800 dark:text-white text-sm">
                      Reminders
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="h-5 w-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                      style={{
                        background: isDark
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <FiX size={10} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <NotificationPanel />
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="h-9 flex items-center gap-2 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <FiUser size={11} />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.name?.split(" ")[0] || "Profile"}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 text-sm font-medium"
            >
              <FiLogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ── Mobile — slim bar: logo + notification bell only ── */}
        <div className="md:hidden flex items-center justify-between px-4 h-16">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 hover:opacity-80 transition min-w-0"
          >
            <img
              src="/icon.png"
              alt="Smart Split"
              className="h-9 w-9 rounded-xl shadow flex-shrink-0"
            />
            <span className="text-[18px] font-bold text-gray-800 dark:text-white tracking-tight truncate">
              Smart Split
            </span>
          </Link>

          {/* Right side: dark mode + notification bell */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleDarkMode}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              aria-label="Toggle dark mode"
            >
              {isDark ? <FiSun size={19} /> : <FiMoon size={19} />}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((p) => !p);
                  if (unreadCount > 0) markAllRead();
                }}
                className="relative h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label="Notifications"
              >
                <FiBell size={19} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={getGradientStyle(theme)}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown on mobile */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{
                    background: isDark
                      ? "rgba(12,12,22,0.96)"
                      : "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(0,0,0,0.07)",
                    boxShadow: isDark
                      ? "0 8px 40px rgba(0,0,0,0.6)"
                      : "0 8px 40px rgba(0,0,0,0.14)",
                  }}
                >
                  <div
                    className="px-4 py-3 border-b flex justify-between items-center"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.06)",
                    }}
                  >
                    <span className="font-bold text-gray-800 dark:text-white text-sm">
                      Reminders
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                      style={{
                        background: isDark
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <FiX size={11} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <NotificationPanel />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Scan Receipt Modal (desktop) */}
      {showScanModal && (
        <ScanReceipt
          groups={groups}
          userId={userId}
          onExpenseCreated={() => {
            setShowScanModal(false);
            navigate("/expenses");
          }}
          onClose={() => setShowScanModal(false)}
        />
      )}
    </>
  );
}
