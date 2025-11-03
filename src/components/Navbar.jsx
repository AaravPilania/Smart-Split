// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiCamera } from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";

export default function Navbar() {
  const navigate = useNavigate();
  const [showScanModal, setShowScanModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const userId = parseInt(localStorage.getItem("userId"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/groups?userId=${userId}`
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
      <div className="w-full bg-white shadow-md py-3 px-6 flex items-center justify-between sticky top-0 z-50">
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

        {/* Navbar Links */}
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

          {/* Scan Receipt Button */}
          <button
            onClick={handleScanClick}
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out flex items-center gap-2"
          >
            <FiCamera />
            <span>Scan Receipt</span>
          </button>

          {/* Profile Button */}
          <button
            onClick={() => navigate("/profile")}
            className="px-3 py-2 rounded-lg text-pink-600 hover:bg-pink-50 transition-all duration-300 ease-out flex items-center gap-1"
            title="Profile Settings"
          >
            <FiUser className="text-lg" />
            <span className="text-sm">Profile</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 transition-all duration-300 ease-out flex items-center gap-1"
          >
            <FiLogOut />
            <span>Logout</span>
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
