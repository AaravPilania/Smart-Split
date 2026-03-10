// src/components/Navbar.jsx
import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiCamera, FiSun, FiMoon } from "react-icons/fi";
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
