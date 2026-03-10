// src/components/Navbar.jsx
import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiCamera } from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";
import { API_URL, apiFetch, clearAuth, getUserId } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";

export default function Navbar() {
  const navigate = useNavigate();
  const { theme } = useTheme();
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

  const navItemClasses =
    "relative px-3 py-2 rounded-lg font-medium text-gray-700 overflow-hidden transition-all duration-300 ease-out";

  const hoverBg =
    "absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 rounded-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out";

  const hoverText =
    "relative z-10 transition-colors duration-300 group-hover:text-white";

  return (
    <>
      <div className="w-full bg-white shadow-md py-3 px-4 sm:px-6 sticky top-0 z-50">
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
            <h1 className="text-xl font-semibold text-gray-700">Smart Split</h1>
          </Link>

          {/* Right items */}}
          <div className="flex items-center gap-4 font-medium">
            <Link className={`group ${navItemClasses}`} to="/dashboard">
              <span className={hoverText}>Dashboard</span>
              <span className={hoverBg}></span>
            </Link>

            <Link className={`group ${navItemClasses}`} to="/groups">
              <span className={hoverText}>Groups</span>
              <span className={hoverBg}></span>
            </Link>

            <Link className={`group ${navItemClasses}`} to="/expenses">
              <span className={hoverText}>Expenses</span>
              <span className={hoverBg}></span>
            </Link>

            <button
              onClick={handleScanClick}
              className="text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center gap-2"
              style={getGradientStyle(theme)}
            >
              <FiCamera />
              <span>Scan Receipt</span>
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
              className="text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 transition-all duration-300 ease-out flex items-center gap-1"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile layout (below md): logo left, actions right */}
        <div className="md:hidden flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          >
            {/* Mobile logo icon */}
            <div className="text-white rounded-lg h-8 w-8 flex items-center justify-center text-lg font-bold shadow-md" style={getGradientStyle(theme, "to bottom right")}>
              ⚡
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanClick}
              className="text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center gap-1.5 text-sm"
              style={getGradientStyle(theme)}
            >
              <FiCamera size={16} />
              <span>Scan</span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className={`p-2 rounded-lg ${theme.textBtn} transition`}
              title="Profile"
            >
              {avatar ? (
                <img src={avatar} alt="avatar" className={`h-7 w-7 rounded-full border ${theme.border} object-cover`} />
              ) : (
                <FiUser size={20} />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
              title="Logout"
            >
              <FiLogOut size={20} />
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
