// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiUser, FiLogOut, FiCamera, FiHome, FiUsers, FiDollarSign } from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";
import { API_URL, apiFetch, clearAuth, getUserId } from "../utils/api";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showScanModal, setShowScanModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const userId = getUserId();
  const [avatar, setAvatar] = useState(null);

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

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("selectedAvatar");
    navigate("/");
  };

  const fetchGroups = async () => {
    try {
      const response = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (response.ok) { const data = await response.json(); setGroups(data.groups || []); }
    } catch {}
  };

  const handleScanClick = () => { fetchGroups(); setShowScanModal(true); };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <FiHome size={15} /> },
    { to: "/groups",    label: "Groups",    icon: <FiUsers size={15} /> },
    { to: "/expenses",  label: "Expenses",  icon: <FiDollarSign size={15} /> },
  ];

  return (
    <>
      <nav className="w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm py-3 px-4 sm:px-8 sticky top-0 z-50">
        <div className="hidden md:flex max-w-6xl mx-auto items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-xl h-9 w-9 flex items-center justify-center text-base font-bold shadow-md group-hover:shadow-pink-300 transition-shadow">
              ⚡
            </div>
            <span className="text-lg font-bold text-gray-800 tracking-tight">Smart Split</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ to, label, icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-pink-600 bg-pink-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {icon}
                  {label}
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleScanClick}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow hover:shadow-md hover:opacity-95 transition-all"
            >
              <FiCamera size={15} />
              Scan Receipt
            </button>

            <button
              onClick={() => navigate("/profile")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/profile" ? "bg-pink-50 text-pink-600" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-pink-200" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                  <FiUser size={12} className="text-white" />
                </div>
              )}
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <FiLogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile: logo + scan */}
        <div className="md:hidden flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-xl h-8 w-8 flex items-center justify-center font-bold shadow">
              ⚡
            </div>
            <span className="text-base font-bold text-gray-800">Smart Split</span>
          </Link>
          <button
            onClick={handleScanClick}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-semibold px-3 py-2 rounded-lg shadow"
          >
            <FiCamera size={14} />
            Scan
          </button>
        </div>
      </nav>

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
            <div className="bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-lg h-8 w-8 flex items-center justify-center text-lg font-bold shadow-md">
              ⚡
            </div>
            <h1 className="text-xl font-semibold text-gray-700">Smart Split</h1>
          </Link>

          {/* Right items */}
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
              className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center gap-2"
            >
              <FiCamera />
              <span>Scan Receipt</span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="px-3 py-2 rounded-lg text-pink-600 hover:bg-pink-50 transition-all duration-300 ease-out flex items-center gap-2"
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

        {/* Mobile layout (below md): single row — logo left, scan button right */}
        <div className="md:hidden flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          >
            <div className="bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-lg h-8 w-8 flex items-center justify-center text-lg font-bold shadow-md">
              ⚡
            </div>
            <h1 className="text-lg font-semibold text-gray-700 whitespace-nowrap">Smart Split</h1>
          </Link>

          <button
            onClick={handleScanClick}
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center gap-1.5 text-sm"
          >
            <FiCamera size={16} />
            <span>Scan</span>
          </button>
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
