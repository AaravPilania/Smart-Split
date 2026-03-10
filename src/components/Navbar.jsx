// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiCamera, FiSun, FiMoon, FiBell } from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";
import { API_URL, apiFetch, clearAuth, getUserId } from "../utils/api";
import { useTheme, getGradientStyle, toggleDarkMode } from "../utils/theme";

export default function Navbar() {
  const navigate = useNavigate();
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

  // Poll notifications every 60 s
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userId]);

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

  const handleScanClick = () => {
    fetchGroups();
    setShowScanModal(true);
  };

  // Theme-aware nav link with gradient hover
  function NavItem({ to, children }) {
    const [hovered, setHovered] = useState(false);
    return (
      <Link
        to={to}
        className="relative px-3 py-2 rounded-lg font-medium overflow-hidden transition-all duration-300 ease-out"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="relative z-10 transition-colors duration-300" style={{ color: hovered ? "white" : undefined }}>
          {children}
        </span>
        <span
          className="absolute inset-0 rounded-lg transition-all duration-300"
          style={{ ...getGradientStyle(theme), opacity: hovered ? 1 : 0, transform: hovered ? "scale(1)" : "scale(0.95)" }}
        />
      </Link>
    );
  }

  return (
    <>
      <div className="w-full bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/60 py-3 px-4 sm:px-6 sticky top-0 z-50 border-b border-transparent dark:border-gray-800 transition-colors duration-200">

        {/* ── Desktop (md+) ── */}
        <div className="hidden md:flex max-w-6xl mx-auto items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
            <div className="text-white rounded-lg h-8 w-8 flex items-center justify-center text-lg font-bold shadow-md" style={getGradientStyle(theme, "to bottom right")}>⚡</div>
            <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-100">Smart Split</h1>
          </Link>

          <div className="flex items-center gap-4 font-medium">
            <NavItem to="/dashboard">Dashboard</NavItem>
            <NavItem to="/groups">Groups</NavItem>
            <NavItem to="/expenses">Expenses</NavItem>
            <NavItem to="/balances">Balances</NavItem>

            <button onClick={handleScanClick} className="text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center gap-2" style={getGradientStyle(theme)}>
              <FiCamera /><span>Scan Receipt</span>
            </button>

            {/* Dark mode toggle */}
            <button onClick={toggleDarkMode} className="p-2.5 rounded-lg text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200" title={isDark ? "Light Mode" : "Dark Mode"}>
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications((p) => !p); if (unreadCount > 0) markAllRead(); }}
                className="relative p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                title="Notifications"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={getGradientStyle(theme)}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-white text-sm">Reminders</span>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y dark:divide-gray-700">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">No reminders yet</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? "opacity-60" : "bg-blue-50/30 dark:bg-blue-900/10"}`}>
                        <p className="text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                          From {n.from?.name || "Someone"} · {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => navigate("/profile")} className={`px-3 py-2 rounded-lg ${theme.textBtn} ${theme.bgHover} transition-all duration-300 ease-out flex items-center gap-2`} title="Profile Settings">
              {avatar ? <img src={avatar} alt="avatar" className="h-6 w-6 rounded-full border" /> : <FiUser className="text-lg" />}
              <span className="text-sm">Profile</span>
            </button>

            <button onClick={handleLogout} className="text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-300 ease-out flex items-center gap-1">
              <FiLogOut /><span>Logout</span>
            </button>
          </div>
        </div>

        {/* ── Mobile (below md) ── */}
        <div className="md:hidden flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition min-w-0">
            <div className="text-white rounded-xl h-9 w-9 flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0" style={getGradientStyle(theme, "to bottom right")}>⚡</div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[15px] font-bold text-gray-800 dark:text-white truncate">Smart Split</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Split bills, stay friends</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Scan */}
            <button onClick={handleScanClick} className="text-white h-9 px-3 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-1.5" style={getGradientStyle(theme)}>
              <FiCamera size={15} />
              <span className="text-xs font-semibold">Scan</span>
            </button>

            {/* Dark mode */}
            <button onClick={toggleDarkMode} className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Toggle theme">
              {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications((p) => !p); if (unreadCount > 0) markAllRead(); }}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <FiBell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={getGradientStyle(theme)}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="fixed left-3 right-3 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-50 overflow-hidden" style={{ top: "56px" }}>
                  <div className="px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-white text-sm">Reminders</span>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 text-xs">✕</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y dark:divide-gray-700">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">No reminders yet</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? "opacity-60" : "bg-blue-50/30 dark:bg-blue-900/10"}`}>
                        <p className="text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                        <p className="text-gray-400 text-xs mt-1">From {n.from?.name || "Someone"} · {new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button onClick={handleLogout} className="h-9 w-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Logout">
              <FiLogOut size={17} />
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


export default function Navbar() {
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const [showScanModal, setShowScanModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const userId = getUserId();
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("selectedAvatar");
    if (saved) setAvatar(saved);
    const onStorage = (e) => {
      if (e.key === "selectedAvatar") {
        setAvatar(e.newValue);
      }
    };
    const onAvatarChanged = () => {
      const latest = localStorage.getItem("selectedAvatar");
      setAvatar(latest);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("avatar-changed", onAvatarChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("avatar-changed", onAvatarChanged);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("selectedAvatar");
    navigate("/");
  };

  const fetchGroups = async () => {
    try {
      const response = await apiFetch(
        `${API_URL}/groups?userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleScanClick = () => {
    fetchGroups();
    setShowScanModal(true);
  };

  // Theme-aware nav link with gradient hover
  function NavItem({ to, children }) {
    const [hovered, setHovered] = useState(false);
    return (
      <Link
        to={to}
        className="relative px-3 py-2 rounded-lg font-medium overflow-hidden transition-all duration-300 ease-out"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          className="relative z-10 transition-colors duration-300"
          style={{ color: hovered ? "white" : undefined }}
        >
          {children}
        </span>
        <span
          className="absolute inset-0 rounded-lg transition-all duration-300"
          style={{
            ...getGradientStyle(theme),
            opacity: hovered ? 1 : 0,
            transform: hovered ? "scale(1)" : "scale(0.95)",
          }}
        />
      </Link>
    );
  }

  return (
    <>
      <div className="w-full bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/60 py-3 px-4 sm:px-6 sticky top-0 z-50 border-b border-transparent dark:border-gray-800 transition-colors duration-200">
        {/* Desktop layout (md and up): original navbar */}
        <div className="hidden md:flex max-w-6xl mx-auto items-center justify-between">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          >
            <div className="text-white rounded-lg h-8 w-8 flex items-center justify-center text-lg font-bold shadow-md" style={getGradientStyle(theme, "to bottom right")}>
              ⚡
            </div>
            <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-100">Smart Split</h1>
          </Link>

          {/* Right items */}
          <div className="flex items-center gap-4 font-medium">
            <NavItem to="/dashboard">Dashboard</NavItem>
            <NavItem to="/groups">Groups</NavItem>
            <NavItem to="/expenses">Expenses</NavItem>

            <button
              onClick={handleScanClick}
              className="text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center gap-2"
              style={getGradientStyle(theme)}
            >
              <FiCamera />
              <span>Scan Receipt</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-lg text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            <button
              onClick={() => navigate("/profile")}
              className={`px-3 py-2 rounded-lg ${theme.textBtn} ${theme.bgHover} transition-all duration-300 ease-out flex items-center gap-2`}
              title="Profile Settings"
            >
              {avatar ? (
                <img src={avatar} alt="avatar" className="h-6 w-6 rounded-full border" />
              ) : (
                <FiUser className="text-lg" />
              )}
              <span className="text-sm">Profile</span>
            </button>

            <button
              onClick={handleLogout}
              className="text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-300 ease-out flex items-center gap-1"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile layout (below md): brand left, actions right */}
        <div className="md:hidden flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
          >
            <div
              className="text-white rounded-xl h-9 w-9 flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0"
              style={getGradientStyle(theme, "to bottom right")}
            >
              ⚡
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-gray-800 dark:text-white">Smart Split</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Split bills, stay friends</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={handleScanClick}
              className="text-white px-2.5 py-1.5 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-1"
              style={getGradientStyle(theme)}
            >
              <FiCamera size={14} />
              <span className="text-xs font-medium">Scan</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title="Logout"
            >
              <FiLogOut size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Scan Receipt Modal */}
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
