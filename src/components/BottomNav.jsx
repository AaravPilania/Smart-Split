import { Link, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiDollarSign, FiUser } from "react-icons/fi";

export default function BottomNav() {
  const { pathname } = useLocation();

  const tabs = [
    { to: "/dashboard", icon: <FiHome size={22} />, label: "Home" },
    { to: "/groups", icon: <FiUsers size={22} />, label: "Groups" },
    { to: "/expenses", icon: <FiDollarSign size={22} />, label: "Expenses" },
    { to: "/profile", icon: <FiUser size={22} />, label: "Profile" },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ to, icon, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
              active ? "text-pink-500" : "text-gray-400"
            }`}
          >
            <span className={active ? "text-pink-500" : "text-gray-400"}>
              {icon}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
