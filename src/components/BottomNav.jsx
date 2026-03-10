import { Link, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiDollarSign, FiUser, FiBarChart2 } from "react-icons/fi";
import { useTheme } from "../utils/theme";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { theme } = useTheme();

  const tabs = [
    { to: "/dashboard", icon: <FiHome size={20} />, label: "Home" },
    { to: "/groups", icon: <FiUsers size={20} />, label: "Groups" },
    { to: "/expenses", icon: <FiDollarSign size={20} />, label: "Expenses" },
    { to: "/balances", icon: <FiBarChart2 size={20} />, label: "Balances" },
    { to: "/profile", icon: <FiUser size={20} />, label: "Profile" },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 flex transition-colors duration-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ to, icon, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
              active ? theme.text : "text-gray-400 dark:text-gray-600"
            }`}
          >
            <span className={active ? theme.text : "text-gray-400 dark:text-gray-600"}>
              {icon}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
