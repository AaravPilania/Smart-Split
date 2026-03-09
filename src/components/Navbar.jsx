// src/components/Navbar.jsx
import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiCamera } from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";
import { API_URL, apiFetch, setAuthToken } from "../utils/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [showScanModal, setShowScanModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const userId = localStorage.getItem("userId");
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
    setAuthToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
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

        {/* Mobile layout (below md): 2x2 grid */}
        <div className="md:hidden max-w-6xl mx-auto grid grid-cols-2 grid-rows-2 gap-x-6 gap-y-2 items-center">
          {/* Row 1, Col 1: Brand */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          >
            <div className="bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-lg h-8 w-8 flex items-center justify-center text-lg font-bold shadow-md">
              ⚡
            </div>
            <h1 className="text-xl font-semibold text-gray-700 whitespace-nowrap">Smart Split</h1>
          </Link>

          {/* Row 1, Col 2: Scan Receipt */}
          <div className="justify-self-end w-48 sm:w-56">
            <button
              onClick={handleScanClick}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center justify-center gap-2"
            >
              <FiCamera />
              <span>Scan Receipt</span>
            </button>
          </div>

          {/* Row 2, Col 1: Tagline */}
          <p className="text-sm font-bold bg-gradient-to-r from-pink-500 to-orange-400 text-transparent bg-clip-text leading-snug">Split bills, keep the chill.</p>

          {/* Row 2, Col 2: Profile + Logout */}
          <div className="justify-self-end w-48 sm:w-56">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/profile")}
                className="px-3 py-2 rounded-lg text-pink-600 hover:bg-pink-50 transition-all duration-300 ease-out flex items-center justify-center gap-2 border"
                title="Profile Settings"
              >
                {avatar ? (
                  <img src={avatar} alt="avatar" className="h-5 w-5 rounded-full border" />
                ) : (
                  <FiUser className="text-lg" />
                )}
                <span className="text-sm">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-300 ease-out flex items-center justify-center gap-2 border"
              >
                <FiLogOut />
                <span className="text-sm">Logout</span>
              </button>
            </div>
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
